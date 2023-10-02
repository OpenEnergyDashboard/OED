/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import Plot from 'react-plotly.js';
import { readingsApi } from '../redux/api/readingsApi';
import { useAppSelector } from '../redux/hooks';
import {
	BarReadingApiArgs, ChartQueryProps,
	selectGroupDataByID,
	selectMeterDataByID, selectUnitDataById
} from '../redux/selectors/dataSelectors';
import { selectSelectedGroups, selectSelectedMeters } from '../redux/selectors/uiSelectors';
import { DataType } from '../types/Datasources';
import Locales from '../types/locales';
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
 * @param props query arguments to be used in the dataFetching Hooks.
 * @returns Plotly BarChart
 */
export default function BarChartComponent(props: ChartQueryProps<BarReadingApiArgs>) {
	const { meterArgs, groupsArgs } = props.queryProps;
	const {
		data: meterReadings,
		isFetching: meterIsFetching
	} = readingsApi.useBarQuery(meterArgs, { skip: !meterArgs.selectedMeters.length });

	const {
		data: groupData,
		isFetching: groupIsFetching
	} = readingsApi.useBarQuery(groupsArgs, { skip: !groupsArgs.selectedGroups.length });

	const barDuration = useAppSelector(state => state.graph.barDuration);
	const barStacking = useAppSelector(state => state.graph.barStacking);
	const unitID = useAppSelector(state => state.graph.selectedUnit);
	const datasets: any[] = [];
	// The unit label depends on the unit which is in selectUnit state.
	const graphingUnit = useAppSelector(state => state.graph.selectedUnit);
	const unitDataByID = useAppSelector(state => selectUnitDataById(state));
	const selectedAreaNormalization = useAppSelector(state => state.graph.areaNormalization);
	const selectedAreaUnit = useAppSelector(state => state.graph.selectedAreaUnit);
	const selectedMeters = useAppSelector(state => selectSelectedMeters(state))
	const selectedGroups = useAppSelector(state => selectSelectedGroups(state))
	const meterDataByID = useAppSelector(state => selectMeterDataByID(state))
	const groupDataByID = useAppSelector(state => selectGroupDataByID(state))

	if (meterIsFetching || groupIsFetching) {
		return <SpinnerComponent loading width={50} height={50} />
	}
	let unitLabel: string = '';
	let raw = false;
	// If graphingUnit is -99 then none selected and nothing to graph so label is empty.
	// This will probably happen when the page is first loaded.
	if (graphingUnit !== -99) {
		const selectUnitState = unitDataByID[unitID];
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
			let groupArea = groupDataByID[groupID].area;
			if (!selectedAreaNormalization || (groupArea > 0 && groupDataByID[groupID].areaUnit != AreaUnitType.none)) {
				if (selectedAreaNormalization) {
					// convert the meter area into the proper unit, if needed
					groupArea *= getAreaUnitConversion(groupDataByID[groupID].areaUnit, selectedAreaUnit);
				}
				const readingsData = groupData[groupID];
				if (readingsData && !groupIsFetching) {
					const label = groupDataByID[groupID].name;
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

	let layout: any;
	// Customize the layout of the plot
	// See https://community.plotly.com/t/replacing-an-empty-graph-with-a-message/31497 for showing text not plot.
	if (raw) {
		// This is a raw type graphing unit so cannot plot
		layout = {
			'xaxis': {
				'visible': false
			},
			'yaxis': {
				'visible': false
			},
			'annotations': [
				{
					'text': `<b>${translate('bar.raw')}</b>`,
					'xref': 'paper',
					'yref': 'paper',
					'showarrow': false,
					'font': {
						'size': 28
					}
				}
			]
		}
	} else if (datasets.length === 0) {
		// There is not data so tell user.
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
		}

	} else {
		// This normal so plot.
		layout = {
			barmode: (barStacking ? 'stack' : 'group'),
			bargap: 0.2, // Gap between different times of readings
			bargroupgap: 0.1, // Gap between different meter's readings under the same timestamp
			autosize: true,
			height: 700,	// Height is set to 700 for now, but we do need to scale in the future (issue #466)
			showlegend: true,
			legend: {
				x: 0,
				y: 1.1,
				orientation: 'h'
			},
			yaxis: {
				title: unitLabel,
				showgrid: true,
				gridcolor: '#ddd'
			},
			xaxis: {
				showgrid: true,
				gridcolor: '#ddd',
				tickfont: {
					size: 10
				},
				tickangle: -45,
				autotick: true,
				nticks: 10,
				automargin: true
			},
			margin: {
				t: 0,
				b: 120,
				l: 120
			}
		};
	}

	// Assign all the parameters required to create the Plotly object (data, layout, config) to the variable props, returned by mapStateToProps
	// The Plotly toolbar is displayed if displayModeBar is set to true (not for bar charts)
	const config = {
		displayModeBar: false,
		responsive: true,
		locales: Locales // makes locales available for use
	}
	return (
		<Plot
			data={datasets as Plotly.Data[]}
			layout={layout as Plotly.Layout}
			config={config}
			style={{ width: '100%', height: '80%' }}
			useResizeHandler={true}
		/>
	);
}

