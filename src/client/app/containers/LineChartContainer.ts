/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as moment from 'moment-timezone';
import { connect } from 'react-redux';
import getGraphColor from '../utils/getGraphColor';
import { State } from '../types/redux/state';
import Plot from 'react-plotly.js';
import { TimeInterval } from '../../../common/TimeInterval';
import Locales from '../types/locales';
import { DataType } from '../types/Datasources';
import translate from '../utils/translate';

function mapStateToProps(state: State) {
	const timeInterval = state.graph.timeInterval;
	const datasets: any[] = [];
	let hasReadings = false
	let layout;
	if (state.graph.selectedGroups.length === 0 && state.graph.selectedMeters.length === 0) {
		layout = {
			title: `<b> ${translate('empty.graph')} </b>`
		}
	} else {
	// Add all valid data from existing meters to the line plot
		for (const meterID of state.graph.selectedMeters) {
			const byMeterID = state.readings.line.byMeterID[meterID];
			if (byMeterID !== undefined) {
				const colorID = meterID;
				const label = state.meters.byMeterID[meterID].name;
				const readingsData = byMeterID[timeInterval.toString()];
				if (state.graph.selectedMeters.length > 1 && readingsData.readings?.length === 0) {
					datasets.push({
						name: `${label}`, // (${translate('no.readings.available.legend')})`,
						visible: true,
						x: [null],
						y: [null],
						type: 'scatter',
						mode: 'lines',
						line: {
							shape: 'spline',
							width: 2,
							color: getGraphColor(colorID, DataType.Meter)
						},
						marker: { color: getGraphColor(colorID, DataType.Meter) }
					});
				}
				else if (readingsData !== undefined && !readingsData.isFetching && readingsData.readings?.length === 0) {
					hasReadings = true
					const label = state.meters.byMeterID[meterID].name;
					const colorID = meterID;
					if (readingsData.readings === undefined) {
						throw new Error('Unacceptable condition: readingsData.readings is undefined.');
					}

					// Create two arrays for the x and y values. Fill the array with the data from the compressed readings
					const xData: string[] = [];
					const yData: number[] = [];
					const hoverText: string[] = [];
					const readings = _.values(readingsData.readings);
					readings.forEach(reading => {
						const st = moment(reading.startTimestamp);
						// Time reading is in the middle of the start and end timestamp
						const timeReading = st.add(moment(reading.endTimestamp).diff(st) / 2);
						xData.push(timeReading.utc().format('YYYY-MM-DD HH:mm:ss'));
						yData.push(reading.reading);
						hoverText.push(`<b> ${timeReading.format('ddd, ll LTS')} </b> <br> ${label}: ${reading.reading.toPrecision(6)} kW`);
					});

					// Save the timestamp range of the plot
					let minTimestamp: string = '';
					let maxTimestamp: string = '';
					if (readings.length > 0) {
						minTimestamp = readings[0]['startTimestamp'].toString();
						maxTimestamp = readings[readings.length - 1]['startTimestamp'].toString();
					}
					const root: any = document.getElementById('root');
					root.setAttribute('min-timestamp', minTimestamp);
					root.setAttribute('max-timestamp', maxTimestamp);

					// This variable contains all the elements (x and y values, line type, etc.) assigned to the data parameter of the Plotly object
					datasets.push({
						name: label,
						x: xData,
						y: yData,
						text: hoverText,
						hoverinfo: 'text',
						type: 'scatter',
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

		// TODO The meters and groups code is very similar and maybe it should be refactored out to create a function to do
		// both. This would mean future changes would automatically happen to both.
		// Add all valid data from existing groups to the line plot
		for (const groupID of state.graph.selectedGroups) {
			const byGroupID = state.readings.line.byGroupID[groupID];
			if (byGroupID !== undefined) {
				const colorID = groupID;
				const label = state.groups.byGroupID[groupID].name;
				const readingsData = byGroupID[timeInterval.toString()];
				if (state.graph.selectedGroups.length > 1 && readingsData.readings?.length === 0) {
					datasets.push({
						name: `${label} (${translate('no.readings.available.legend')})`,
						visible: true,
						x: [null],
						y: [null],
						type: 'scatter',
						mode: 'lines',
						line: {
							shape: 'spline',
							width: 2,
							color: getGraphColor(colorID, DataType.Group)
						}
					});
				}
				else if (readingsData !== undefined && !readingsData.isFetching  && readingsData.readings?.length !== 0) {
					hasReadings = true
					const label = state.groups.byGroupID[groupID].name;
					const colorID = groupID;
					if (readingsData.readings === undefined) {
						throw new Error('Unacceptable condition: readingsData.readings is undefined.');
					}

					// Create two arrays for the x and y values. Fill the array with the data from the compressed readings
					const xData: string[] = [];
					const yData: number[] = [];
					const hoverText: string[] = [];
					const readings = _.values(readingsData.readings);
					readings.forEach(reading => {
						const st = moment(reading.startTimestamp);
						// Time reading is in the middle of the start and end timestamp
						const timeReading = st.add(moment(reading.endTimestamp).diff(st) / 2);
						xData.push(timeReading.utc().format('YYYY-MM-DD HH:mm:ss'));
						yData.push(reading.reading);
						hoverText.push(`<b> ${timeReading.format('ddd, ll LTS'	)} </b> <br> ${label}: ${reading.reading.toPrecision(6)} kW`);
					});

					// This variable contains all the elements (x and y values, line type, etc.) assigned to the data parameter of the Plotly object
					datasets.push({
						name: label,
						x: xData,
						y: yData,
						text: hoverText,
						hoverinfo: 'text',
						type: 'scatter',
						mode: 'lines',
						line: {
							shape: 'spline',
							width: 2,
							color: getGraphColor(colorID, DataType.Group)
						}
					});
				}
			}
		}

		// Calculate slider interval if rangeSliderInterval is specified;
		const sliderInterval = state.graph.rangeSliderInterval.equals(TimeInterval.unbounded()) ? timeInterval : state.graph.rangeSliderInterval;
		const start = Date.parse(moment(sliderInterval.getStartTimestamp()).toISOString());
		const end = Date.parse(moment(sliderInterval.getEndTimestamp()).toISOString());

		// Customize the layout of the plot
		if (hasReadings) {
			layout = {
				autosize: true,
				showlegend: true,
				height: 700,
				legend: {
					x: 0,
					y: 1.1,
					orientation: 'h'
				},
				yaxis: {
					title: 'kW',
					gridcolor: '#ddd'
				},

				xaxis: {
					range: [start, end], // Specifies the start and end points of visible part of graph(unshaded region on slider);
					rangeslider: {
						thickness: 0.1
					},
					showgrid: true,
					gridcolor: '#ddd'
				},
				margin: {
					t: 10,
					b: 10
				}
			};
		} else {
			layout = {
				title: `<b>${translate('no.readings.available')}</b>`
			}
		}
	}
	// Assign all the parameters required to create the Plotly object (data, layout, config) to the variable props, returned by mapStateToProps
	// The Plotly toolbar is displayed if displayModeBar is set to true
	const props: any = {
		data: datasets,
		layout,
		config: {
			displayModeBar: true,
			responsive: true,
			locales: Locales // makes locales available for use
		}
	};
	props.config.locale = state.admin.defaultLanguage;
	return props;
}

export default connect(mapStateToProps)(Plot);
