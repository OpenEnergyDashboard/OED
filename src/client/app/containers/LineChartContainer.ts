/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as moment from 'moment';
import { connect } from 'react-redux';
import getGraphColor from '../utils/getGraphColor';
import { State } from '../types/redux/state';
import PlotlyChart, { IPlotlyChartProps } from 'react-plotlyjs-ts';

function mapStateToProps(state: State) {
	const timeInterval = state.graph.timeInterval;
	const datasets: any[] = [];

	// Add all valid data from existing meters to the line plot
	for (const meterID of state.graph.selectedMeters) {
		const byMeterID = state.readings.line.byMeterID[meterID];
		if (byMeterID !== undefined) {
			const readingsData = byMeterID[timeInterval.toString()];
			if (readingsData !== undefined && !readingsData.isFetching) {
				const label = state.meters.byMeterID[meterID].name;
				if (readingsData.readings === undefined) {
					throw new Error('Unacceptable condition: readingsData.readings is undefined.');
				}

				// Create two arrays for the x and y values. Fill the array with the data from the compressed readings
				const xData: string[] = [];
				const yData: number[] = [];
				const hoverText: string[] = [];
				const readings = _.values(readingsData.readings);
				readings.forEach(reading => {
					const timeReading = moment(reading.startTimestamp);
					xData.push(timeReading.format('YYYY-MM-DD HH:mm:ss'));
					yData.push(reading.reading);
					hoverText.push(`<b> ${timeReading.format('dddd, MMM DD, YYYY hh:mm a')} </b> <br> ${label}: ${reading.reading} kW`);
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
						width: 3
					},
					marker: {color: getGraphColor(label)}
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
			const readingsData = byGroupID[timeInterval.toString()];
			if (readingsData !== undefined && !readingsData.isFetching) {
				const label = state.groups.byGroupID[groupID].name;
				if (readingsData.readings === undefined) {
					throw new Error('Unacceptable condition: readingsData.readings is undefined.');
				}

				// Create two arrays for the x and y values. Fill the array with the data from the compressed readings
				const xData: string[] = [];
				const yData: number[] = [];
				const hoverText: string[] = [];
				const readings = _.values(readingsData.readings);
				readings.forEach(reading => {
					const timeReading = moment(reading.startTimestamp);
					xData.push(timeReading.format('YYYY-MM-DD HH:mm:ss'));
					yData.push(reading.reading);
					hoverText.push(`<b> ${timeReading.format('dddd, MMM DD, YYYY hh:mm a')} </b> <br> ${label}: ${reading.reading} kW`);
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
						width: 3
					},
					marker: {color: getGraphColor(label)}
				});
			}
		}
	}

	// Customize the layout of the plot
	const layout: any = {
		autosize: true,
		showlegend: true,
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
			rangeslider: {thickness: 0.1},
			showgrid: true,
			gridcolor: '#ddd'
		},
		margin: {
			t: 10,
			b: 10
		}
	};

	// Assign all the parameters required to create the Plotly object (data, layout, config) to the variable props, returned by mapStateToProps
	// The Plotly toolbar is displayed if displayModeBar is set to true
	const props: IPlotlyChartProps = {
		data: datasets,
		layout,
		config: {
			displayModeBar: true
		}
	};

	return props;
}

export default connect(mapStateToProps)(PlotlyChart);
