/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as moment from 'moment';
import { connect } from 'react-redux';
import getGraphColor from '../utils/getGraphColor';
import { State } from '../types/redux/state';
import PlotlyChart, { IPlotlyChartProps } from 'react-plotlyjs-ts';

function mapStateToProps(state: State){
	const timeInterval = state.graph.timeInterval;
	const datasets: any[] = [];

	// Add all meters data to the chart
	for (const meterID of state.graph.selectedMeters) {
		const byMeterID = state.readings.line.byMeterID[meterID];
		if (byMeterID !== undefined) {
			const readingsData = byMeterID[timeInterval.toString()];
			if (readingsData !== undefined && !readingsData.isFetching) {
				const label = state.meters.byMeterID[meterID].name;
				if (readingsData.readings === undefined) {
					throw new Error('Unacceptable condition: readingsData.readings is undefined.');
				}

				const xData: string[] = [];
				const yData: number[] = [];
				const hoverText: string[] = [];
				const readings = _.values(readingsData.readings);
				readings.forEach(reading => {
					const readingTime = moment(reading.startTimestamp);
					xData.push(readingTime.format('YYYY-MM-DD HH:mm:ss'));
					yData.push(reading.reading);
					hoverText.push(`<b> ${readingTime.format('dddd, MMM DD, YYYY hh:mm a')} </b> <br> ${label}: ${reading.startTimestamp} kW`);
				});

				// Save plot timestamp range
				let minTimestamp: string = "";
				let maxTimestamp: string = "";
				if (readings.length > 0){
					minTimestamp = readings[0]["startTimestamp"].toString();
					maxTimestamp = readings[readings.length-1]["startTimestamp"].toString();
				}
				let root: any = document.getElementById('root');
				root.setAttribute("min-timestamp", minTimestamp);
				root.setAttribute("max-timestamp", maxTimestamp);

				datasets.push({
					name: label,
					x: xData,
					y: yData,
					text: hoverText,
					hoverinfo: 'text',
					type: 'scatter',
					mode: 'lines',
					line: {shape: 'spline'},
					marker: {color: getGraphColor(label)}
				});
			}
		}
	}

	// Add all groups data to the chart
	for (const groupID of state.graph.selectedGroups) {
		const byGroupID = state.readings.line.byGroupID[groupID];
		if (byGroupID !== undefined) {
			const readingsData = byGroupID[timeInterval.toString()];
			if (readingsData !== undefined && !readingsData.isFetching) {
				const label = state.groups.byGroupID[groupID].name;
				if (readingsData.readings === undefined) {
					throw new Error('Unacceptable condition: readingsData.readings is undefined.');
				}

				const xData: string[] = [];
				const yData: number[] = [];
				const hoverText: string[] = [];
				_.values(readingsData.readings).forEach(reading => {
					const readingTime = moment(reading.startTimestamp);
					xData.push(readingTime.format('YYYY-MM-DD HH:mm:ss'));
					yData.push(reading.reading);
					hoverText.push(`<b> ${readingTime.format('dddd, MMM DD, YYYY hh:mm a')} </b> <br> ${label}: ${reading.startTimestamp} kW`);
				});

				datasets.push({
					name: label,
					x: xData,
					y: yData,
					text: hoverText,
					hoverinfo: 'text',
					type: 'scatter',
					mode: 'lines',
					line: {shape: 'spline'},
					marker: {color: getGraphColor(label)}
				});
			}
		}
	}
	const layout: any = {
		autozise: true,
		title: 'First Test',
		showlegend: true,
		legend: {
			x: 0,
			y: 1.1,
			orientation: 'h',
		},
		yaxis: {
			title: 'kW',
			showgrid: true,
			gridcolor: '#ddd'
		},
		xaxis: {
			rangeslider: {thickness: 0.1},
			showgrid: true,
			gridcolor: '#ddd'
		}
	};


	const props: IPlotlyChartProps = {
		data: datasets,
		layout
	};

	return props;
}

export default connect(mapStateToProps)(PlotlyChart);
