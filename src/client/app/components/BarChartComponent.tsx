/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as moment from 'moment';
import { PlotRelayoutEvent } from 'plotly.js';
import * as React from 'react';
import Plot from 'react-plotly.js';
import { TimeInterval } from '../../../common/TimeInterval';
import {
	graphSlice, selectAreaUnit, selectBarStacking, selectBarWidthDays,
	selectGraphAreaNormalization, selectSelectedGroups, selectSelectedMeters, selectSelectedUnit
} from '../redux/slices/graphSlice';
import { selectGroupDataById } from '../redux/api/groupsApi';
import { selectMeterDataById } from '../redux/api/metersApi';
import { readingsApi } from '../redux/api/readingsApi';
import { selectUnitDataById } from '../redux/api/unitsApi';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectBarChartQueryArgs } from '../redux/selectors/chartQuerySelectors';
import { DataType } from '../types/Datasources';
import { UnitRepresentType } from '../types/redux/units';
import { AreaUnitType, getAreaUnitConversion } from '../utils/getAreaUnitConversion';
import getGraphColor from '../utils/getGraphColor';
import { barUnitLabel } from '../utils/graphics';
import translate from '../utils/translate';
import SpinnerComponent from './SpinnerComponent';

/**
 * Passes the current redux state of the barchart, and turns it into props for the React
 * component, which is what will be visible on the page. Makes it possible to access
 * your reducer state objects from within your React components.
 * @returns Plotly BarChart
 */
export default function BarChartComponent() {
	const dispatch = useAppDispatch();
	const { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip } = useAppSelector(selectBarChartQueryArgs)
	const { data: meterReadings, isLoading: meterIsFetching } = readingsApi.useBarQuery(meterArgs, { skip: meterShouldSkip });
	const { data: groupData, isLoading: groupIsFetching } = readingsApi.useBarQuery(groupArgs, { skip: groupShouldSkip });

	const barDuration = useAppSelector(selectBarWidthDays);
	const barStacking = useAppSelector(selectBarStacking);
	const unitID = useAppSelector(selectSelectedUnit);
	// The unit label depends on the unit which is in selectUnit state.
	const graphingUnit = useAppSelector(selectSelectedUnit);
	const unitDataById = useAppSelector(selectUnitDataById);

	const selectedAreaNormalization = useAppSelector(selectGraphAreaNormalization);
	const selectedAreaUnit = useAppSelector(selectAreaUnit);
	const selectedMeters = useAppSelector(selectSelectedMeters);
	const selectedGroups = useAppSelector(selectSelectedGroups);
	const meterDataByID = useAppSelector(selectMeterDataById);
	const groupDataById = useAppSelector(selectGroupDataById);

	// useQueryHooks for data fetching
	const datasets = [];

	if (meterIsFetching || groupIsFetching) {
		return <SpinnerComponent loading width={50} height={50} />
	}
	let unitLabel: string = '';
	let raw = false;
	// If graphingUnit is -99 then none selected and nothing to graph so label is empty.
	// This will probably happen when the page is first loaded.
	if (graphingUnit !== -99) {
		const selectUnitState = unitDataById[unitID];
		if (selectUnitState !== undefined) {
			// Determine the y-axis label.
			unitLabel = barUnitLabel(selectUnitState, selectedAreaNormalization, selectedAreaUnit);
			if (selectUnitState.unitRepresent === UnitRepresentType.raw) {
				// Cannot graph raw units as bar so put title to indicate that and empty otherwise.
				raw = true;
			}
		}
	}

	// Add all valid data from existing meters to the bar chart
	for (const meterID of selectedMeters) {
		if (meterReadings) {
			let meterArea = meterDataByID[meterID].area;
			// we either don't care about area, or we do in which case there needs to be a nonzero area
			if (!selectedAreaNormalization || (meterArea > 0 && meterDataByID[meterID].areaUnit != AreaUnitType.none)) {
				if (selectedAreaNormalization) {
					// convert the meter area into the proper unit, if needed
					meterArea *= getAreaUnitConversion(meterDataByID[meterID].areaUnit, selectedAreaUnit);
				}
				const readingsData = meterReadings[meterID];
				if (readingsData && !meterIsFetching) {
					const label = meterDataByID[meterID].identifier;
					const colorID = meterID;
					if (!readingsData) {
						throw new Error('Unacceptable condition: readingsData.readings is undefined.');
					}

					// Create two arrays for the x and y values. Fill the array with the data.
					const xData: string[] = [];
					const yData: number[] = [];
					const hoverText: string[] = [];
					const readings = _.values(readingsData);
					readings.forEach(barReading => {
						const st = moment.utc(barReading.startTimestamp);
						// Time reading is in the middle of the start and end timestamp (may change this depending on how it looks on the bar graph)\
						const timeReading = st.add(moment.utc(barReading.endTimestamp).diff(st) / 2);
						xData.push(timeReading.utc().format('YYYY-MM-DD HH:mm:ss'));
						let readingValue = barReading.reading;
						if (selectedAreaNormalization) {
							readingValue /= meterArea;
						}
						yData.push(readingValue);
						// only display a range of dates for the hover text if there is more than one day in the range
						let timeRange: string = `${moment.utc(barReading.startTimestamp).format('ll')}`;
						if (barDuration.asDays() != 1) {
							// subtracting one extra day caused by day ending at midnight of the next day.
							// Going from DB unit timestamp that is UTC so force UTC with moment, as usual.
							timeRange += ` - ${moment.utc(barReading.endTimestamp).subtract(1, 'days').format('ll')}`;
						}
						hoverText.push(`<b> ${timeRange} </b> <br> ${label}: ${readingValue.toPrecision(6)} ${unitLabel}`);
					});
					// This variable contains all the elements (x and y values, bar type, etc.) assigned to the data parameter of the Plotly object
					datasets.push({
						name: label,
						x: xData,
						y: yData,
						text: hoverText,
						hoverinfo: 'text',
						type: 'bar',
						marker: { color: getGraphColor(colorID, DataType.Meter) }
					});
				}
			}
		}
	}

	for (const groupID of selectedGroups) {
		if (groupData) {
			let groupArea = groupDataById[groupID].area;
			if (!selectedAreaNormalization || (groupArea > 0 && groupDataById[groupID].areaUnit != AreaUnitType.none)) {
				if (selectedAreaNormalization) {
					// convert the meter area into the proper unit, if needed
					groupArea *= getAreaUnitConversion(groupDataById[groupID].areaUnit, selectedAreaUnit);
				}
				const readingsData = groupData[groupID];
				if (readingsData && !groupIsFetching) {
					const label = groupDataById[groupID].name;
					const colorID = groupID;
					if (!readingsData) {
						throw new Error('Unacceptable condition: readingsData.readings is undefined.');
					}

					// Create two arrays for the x and y values. Fill the array with the data.
					const xData: string[] = [];
					const yData: number[] = [];
					const hoverText: string[] = [];
					const readings = _.values(readingsData);
					readings.forEach(barReading => {
						const st = moment.utc(barReading.startTimestamp);
						// Time reading is in the middle of the start and end timestamp (may change this depending on how it looks on the bar graph)\
						const timeReading = st.add(moment.utc(barReading.endTimestamp).diff(st) / 2);
						xData.push(timeReading.utc().format('YYYY-MM-DD HH:mm:ss'));
						let readingValue = barReading.reading;
						if (selectedAreaNormalization) {
							readingValue /= groupArea;
						}
						yData.push(readingValue);
						// only display a range of dates for the hover text if there is more than one day in the range
						let timeRange: string = `${moment.utc(barReading.startTimestamp).format('ll')}`;
						if (barDuration.asDays() != 1) {
							// subtracting one extra day caused by day ending at midnight of the next day.
							// Going from DB unit timestamp that is UTC so force UTC with moment, as usual.
							timeRange += ` - ${moment.utc(barReading.endTimestamp).subtract(1, 'days').format('ll')}`;
						}
						hoverText.push(`<b> ${timeRange} </b> <br> ${label}: ${readingValue.toPrecision(6)} ${unitLabel}`);
					});

					// This variable contains all the elements (x and y values, bar chart, etc.) assigned to the data parameter of the Plotly object
					datasets.push({
						name: label,
						x: xData,
						y: yData,
						text: hoverText,
						hoverinfo: 'text',
						type: 'bar',
						marker: { color: getGraphColor(colorID, DataType.Group) }
					});
				}
			}
		}
	}

	const handleRelayout = (e: PlotRelayoutEvent) => {
		// This event emits an object that contains values indicating changes in the user's graph, such as zooming.
		// These values indicate when the user has zoomed or made other changes to the graph.
		if (e['xaxis.range[0]'] && e['xaxis.range[0]']) {
			// The event signals changes in the user's interaction with the graph.
			// this will automatically trigger a refetch due to updating a query arg.
			const startTS = moment.utc(e['xaxis.range[0]'])
			const endTS = moment.utc(e['xaxis.range[1]'])
			const workingTimeInterval = new TimeInterval(startTS, endTS);
			dispatch(graphSlice.actions.updateTimeInterval(workingTimeInterval));
		}
	}

	// Assign all the parameters required to create the Plotly object (data, layout, config) to the variable props, returned by mapStateToProps
	// The Plotly toolbar is displayed if displayModeBar is set to true (not for bar charts)

	if (raw) {
		return <h1><b>${translate('bar.raw')}</b></h1>
	}
	let enoughData = false;
	datasets.forEach(dataset => {
		if (dataset.x.length > 1) {
			enoughData = true
		}
	})
	if (datasets.length === 0) {
		return <h1>
			{`${translate('select.meter.group')}`}
		</h1>
	} else if (!enoughData) {
		// This normal so plot.
		return <h1>
			{`${translate('threeD.no.data')}`}
		</h1>
	} else {
		return (
			<Plot
				data={datasets as Plotly.Data[]}
				style={{ width: '100%', height: '100%' }}
				onRelayout={handleRelayout}
				useResizeHandler={true}
				config={{
					displayModeBar: false,
					responsive: true
				}}
				layout={{
					barmode: (barStacking ? 'stack' : 'group'),
					bargap: 0.2, // Gap between different times of readings
					bargroupgap: 0.1, // Gap between different meter's readings under the same timestamp
					showlegend: true,
					legend: { x: 0, y: 1.1, orientation: 'h' },
					yaxis: {
						title: unitLabel, showgrid: true,
						gridcolor: '#ddd', fixedrange: true
					},
					xaxis: {
						rangeslider: { visible: true },
						// rangeselector: { visible: true },
						showgrid: true, gridcolor: '#ddd',
						tickangle: -45, autotick: true,
						nticks: 10,
						tickfont: { size: 10 }
					}
				}}
			/>
		);
	}
}