/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { values } from 'lodash';
import * as moment from 'moment';
import { Layout } from 'plotly.js';
import * as React from 'react';
import Plot from 'react-plotly.js';
import { selectGroupDataById } from '../redux/api/groupsApi';
import { selectMeterDataById } from '../redux/api/metersApi';
import { readingsApi } from '../redux/api/readingsApi';
import { selectUnitDataById } from '../redux/api/unitsApi';
import { useAppSelector } from '../redux/reduxHooks';
import { selectRadarChartQueryArgs } from '../redux/selectors/chartQuerySelectors';
import { selectScalingFromEntity } from '../redux/selectors/entitySelectors';
import {
	selectAreaUnit, selectGraphAreaNormalization, selectLineGraphRate,
	selectSelectedGroups, selectSelectedMeters, selectSelectedUnit
} from '../redux/slices/graphSlice';
import { DataType } from '../types/Datasources';
import Locales from '../types/locales';
import { AreaUnitType } from '../utils/getAreaUnitConversion';
import getGraphColor from '../utils/getGraphColor';
import { lineUnitLabel } from '../utils/graphics';
import { useTranslate } from '../redux/componentHooks';
import SpinnerComponent from './SpinnerComponent';

/**
 * @returns radar plotly component
 */
export default function RadarChartComponent() {
	const translate = useTranslate();
	const { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip } = useAppSelector(selectRadarChartQueryArgs);
	const { data: meterReadings, isLoading: meterIsLoading } = readingsApi.useLineQuery(meterArgs, { skip: meterShouldSkip });
	const { data: groupData, isLoading: groupIsLoading } = readingsApi.useLineQuery(groupArgs, { skip: groupShouldSkip });
	const datasets: any[] = [];
	// graphic unit selected
	const graphingUnit = useAppSelector(selectSelectedUnit);
	// The current selected rate
	const currentSelectedRate = useAppSelector(selectLineGraphRate);
	const unitDataById = useAppSelector(selectUnitDataById);

	const areaNormalization = useAppSelector(selectGraphAreaNormalization);
	const selectedAreaUnit = useAppSelector(selectAreaUnit);
	const selectedMeters = useAppSelector(selectSelectedMeters);
	const selectedGroups = useAppSelector(selectSelectedGroups);
	const meterDataById = useAppSelector(selectMeterDataById);
	const groupDataById = useAppSelector(selectGroupDataById);

	if (meterIsLoading || groupIsLoading) {
		return <SpinnerComponent loading width={50} height={50} />;
		// return <SpinnerComponent loading width={50} height={50} />
	}

	let unitLabel = '';
	let needsRateScaling = false;
	// If graphingUnit is -99 then none selected and nothing to graph so label is empty.
	// This will probably happen when the page is first loaded.
	if (graphingUnit !== -99) {
		const selectUnitState = unitDataById[graphingUnit];
		if (selectUnitState !== undefined) {
			// Determine the r-axis label and if the rate needs to be scaled.
			const returned = lineUnitLabel(selectUnitState, currentSelectedRate, areaNormalization, selectedAreaUnit);
			unitLabel = returned.unitLabel;
			needsRateScaling = returned.needsRateScaling;
		}
	}
	// The rate will be 1 if it is per hour (since state readings are per hour) or no rate scaling so no change.
	const rateScaling = needsRateScaling ? currentSelectedRate.rate : 1;

	// Add all valid data from existing meters to the radar plot
	for (const meterID of selectedMeters) {
		if (meterReadings) {
			const entity = meterDataById[meterID];
			// We either don't care about area, or we do in which case there needs to be a nonzero area.
			if (!areaNormalization || (entity.area > 0 && entity.areaUnit != AreaUnitType.none)) {
				const scaling = selectScalingFromEntity(entity, selectedAreaUnit, areaNormalization, rateScaling);
				const readingsData = meterReadings[meterID];
				if (readingsData) {
					const label = entity.identifier;
					const colorID = meterID;
					// TODO If we are sure the data is always defined then remove this commented out code.
					// Be consistent for all graphing and groups below.
					// if (readingsData.readings === undefined) {
					// 	throw new Error('Unacceptable condition: readingsData.readings is undefined.');
					// }
					// Create two arrays for the distance (rData) and angle (thetaData) values. Fill the array with the data from the line readings.
					// HoverText is the popup value show for each reading.
					const thetaData: string[] = [];
					const rData: number[] = [];
					const hoverText: string[] = [];
					const readings = values(readingsData);
					readings.forEach(reading => {
						// As usual, we want to interpret the readings in UTC. We lose the timezone as these start/endTimestamp
						// are equivalent to Unix timestamp in milliseconds.
						const st = moment.utc(reading.startTimestamp);
						// Time reading is in the middle of the start and end timestamp
						const timeReading = st.add(moment.utc(reading.endTimestamp).diff(st) / 2);
						// The angular value is the date, internationalized.
						thetaData.push(timeReading.format('ddd, ll LTS'));
						// The scaling is the factor to change the reading by.
						const readingValue = reading.reading * scaling;
						rData.push(readingValue);
						hoverText.push(`<b> ${timeReading.format('ddd, ll LTS')} </b> <br> ${label}: ${readingValue.toPrecision(6)} ${unitLabel}`);
					});

					// This variable contains all the elements (plot values, line type, etc.) assigned to the data parameter of the Plotly object
					datasets.push({
						name: label,
						theta: thetaData,
						r: rData,
						text: hoverText,
						hoverinfo: 'text',
						type: 'scatterpolar',
						mode: 'lines',
						line: {
							shape: 'spline',
							width: 2,
							color: getGraphColor(colorID, DataType.Meter)
						}
					});
				}
			}
		}
	}

	// Add all valid data from existing groups to the radar plot
	for (const groupID of selectedGroups) {
		// const byGroupID = state.readings.line.byGroupID[groupID];
		if (groupData) {
			const entity = groupDataById[groupID];
			// We either don't care about area, or we do in which case there needs to be a nonzero area.
			if (!areaNormalization || (entity.area > 0 && entity.areaUnit != AreaUnitType.none)) {
				const scaling = selectScalingFromEntity(entity, selectedAreaUnit, areaNormalization, rateScaling);
				const readingsData = groupData[groupID];
				if (readingsData) {
					const label = entity.name;
					const colorID = groupID;
					// if (readingsData.readings === undefined) {
					// 	throw new Error('Unacceptable condition: readingsData.readings is undefined.');
					// }
					// Create two arrays for the distance (rData) and angle (thetaData) values. Fill the array with the data from the line readings.
					// HoverText is the popup value show for each reading.
					const thetaData: string[] = [];
					const rData: number[] = [];
					const hoverText: string[] = [];
					const readings = values(readingsData);
					readings.forEach(reading => {
						// As usual, we want to interpret the readings in UTC. We lose the timezone as these start/endTimestamp
						// are equivalent to Unix timestamp in milliseconds.
						const st = moment.utc(reading.startTimestamp);
						// Time reading is in the middle of the start and end timestamp
						const timeReading = st.add(moment.utc(reading.endTimestamp).diff(st) / 2);
						// The angular value is the date, internationalized.
						thetaData.push(timeReading.format('ddd, ll LTS'));
						// The scaling is the factor to change the reading by.
						const readingValue = reading.reading * scaling;
						rData.push(readingValue);
						hoverText.push(`<b> ${timeReading.format('ddd, ll LTS')} </b> <br> ${label}: ${readingValue.toPrecision(6)} ${unitLabel}`);
					});

					// This variable contains all the elements (plot values, line type, etc.) assigned to the data parameter of the Plotly object
					datasets.push({
						name: label,
						theta: thetaData,
						r: rData,
						text: hoverText,
						hoverinfo: 'text',
						type: 'scatterpolar',
						mode: 'lines',
						line: {
							shape: 'spline',
							width: 2,
							color: getGraphColor(colorID, DataType.Meter)
						}
					});
				}
			}
		}
	}

	let layout: Partial<Layout>;
	// TODO See 3D code for functions that can be used for layout and notices.
	if (datasets.length === 0) {
		// There are no meters so tell user.
		// Customize the layout of the plot
		// See https://community.plotly.com/t/replacing-an-empty-graph-with-a-message/31497 for showing text not plot.
		layout = {
			'xaxis': {
				'visible': false
			},
			'yaxis': {
				'visible': false
			},
			'annotations': [
				{
					'text': `${translate('select.meter.group')}`,
					'xref': 'paper',
					'yref': 'paper',
					'showarrow': false,
					'font': {
						'size': 28
					}
				}
			]
		};
	} else {
		// Plotly scatterpolar plots have the unfortunate attribute that if a smaller number of plotting
		// points is done first then that impacts the labeling of the polar coordinate where you can get
		// duplicated labels and the points on the separate lines are separated. It is unclear if this is
		// intentional or a bug that will go away. To deal with this, the lines are ordered by size.
		// Descending (reverse) sort datasets by size of readings. Use r but theta should be the same.
		datasets.sort((a, b) => {
			return b.r.length - a.r.length;
		});
		if (datasets[0].r.length === 0) {
			// The longest line (first one) has no data so there is no data in any of the lines.
			// Customize the layout of the plot
			// See https://community.plotly.com/t/replacing-an-empty-graph-with-a-message/31497 for showing text not plot.
			// There is no data so tell user - likely due to date range outside where readings.
			// Remove plotting data even though none there is an empty r & theta that gives empty graphic.
			datasets.splice(0, datasets.length);
			layout = {
				'xaxis': {
					'visible': false
				},
				'yaxis': {
					'visible': false
				},
				'annotations': [
					{
						'text': `${translate('radar.no.data')}`,
						'xref': 'paper',
						'yref': 'paper',
						'showarrow': false,
						'font': {
							'size': 28
						}
					}
				]
			};
		} else {
			// Check if all the values for the dates are compatible. Plotly does not like having different dates in different
			// scatterpolar lines. Lots of attempts to get this to work failed so not going to allow since not that common.
			// Compare the dates (theta) for line with the max points (index 0) to see if it has all the points in all other lines.
			let ok = true;
			for (let i = 1; i < datasets.length; i++) {
				// Current line to consider.
				const currentLine: string[] = datasets[i].theta;
				// See if all points in current line are in max length line. && means get false if any false.
				ok = ok && currentLine.every(v => datasets[0].theta.includes(v));
			}
			if (!ok) {
				// Not all points align on all lines so inform user.
				// Remove plotting data.
				datasets.splice(0, datasets.length);
				// The lines are not compatible so tell user.
				layout = {
					'xaxis': {
						'visible': false
					},
					'yaxis': {
						'visible': false
					},
					'annotations': [
						{
							'text': `${translate('radar.lines.incompatible')}`,
							'xref': 'paper',
							'yref': 'paper',
							'showarrow': false,
							'font': {
								'size': 28
							}
						}
					]
				};
			} else {
				// Data available and okay so plot.
				// Maximum number of ticks, represents 12 months. Too many is cluttered so this seems good value.
				// Plotly shows less if only a few points.
				const maxTicks = 12;
				layout = {
					autosize: true,
					showlegend: true,
					height: 800,
					legend: {
						x: 0,
						y: 1.1,
						orientation: 'h'
					},
					polar: {
						radialaxis: {
							title: unitLabel,
							showgrid: true,
							gridcolor: '#ddd'
						},
						angularaxis: {
							// TODO Attempts to format the dates to remove the time did not work with plotly
							// choosing the tick values which is desirable. Also want time if limited time range.
							direction: 'clockwise',
							showgrid: true,
							gridcolor: '#ddd',
							nticks: maxTicks
						}
					},
					margin: {
						t: 10,
						b: -20
					}
				};
			}
		}
	}

	// props.config.locale = state.options.selectedLanguage;
	return (
		<div style={{ width: '100%', height: '100%' }}>
			<Plot
				data={datasets}
				style={{ width: '100%', height: '80%' }}
				useResizeHandler={true}
				config={{
					displayModeBar: true,
					responsive: true,
					locales: Locales // makes locales available for use
				}}
				layout={layout}
			/>
		</div>
	);
}
