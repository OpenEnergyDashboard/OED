/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as moment from 'moment';
import { connect } from 'react-redux';
import getGraphColor from '../utils/getGraphColor';
import { State } from '../types/redux/state';
import PlotlyChart, { IPlotlyChartProps } from 'react-plotlyjs-ts';
import Locales from '../types/locales';
import { DataType } from '../types/Datasources';

/* Passes the current redux state of the barchart, and turns it into props for the React
*  component, which is what will be visible on the page. Makes it possible to access
*  your reducer state objects from within your React components.
*
*  Returns the props object. */
function mapStateToProps(state: State) {
	const timeInterval = state.graph.timeInterval;
	const barDuration = state.graph.barDuration;
	const datasets: any[] = [];

	// Add all valid data from existing meters to the bar chart
	for (const meterID of state.graph.selectedMeters) {
		const byMeterID = state.readings.bar.byMeterID[meterID];
		if (byMeterID !== undefined) {
			const readingsData = byMeterID[timeInterval.toString()][barDuration.toISOString()];
			if (readingsData !== undefined && !readingsData.isFetching) {
				const label = state.meters.byMeterID[meterID].name;
				const colorID = meterID;
				if (readingsData.readings === undefined) {
					throw new Error('Unacceptable condition: readingsData.readings is undefined.');
				}

				// Create two arrays for the x and y values. Fill the array with the data.
				const xData: string[] = [];
				const yData: number[] = [];
				const hoverText: string[] = [];
				const readings = _.orderBy(readingsData.readings, ['startTimestamp'], ['asc']);
				readings.forEach(barReading => {
					const timeReading: string =
						`${moment(barReading.startTimestamp).utc().format('LL')} - ${moment(barReading.endTimestamp).utc().format('LL')}`;
					xData.push(timeReading);
					yData.push(barReading.reading);
					hoverText.push(`<b> ${timeReading} </b> <br> ${label}: ${barReading.reading} kWh`);
				});

				// This variable contains all the elements (x and y values, bar type, etc.) assigned to the data parameter of the Plotly object
				datasets.push({
					name: label,
					x: xData,
					y: yData,
					text: hoverText,
					hoverinfo: 'text',
					type: 'bar',
					marker: {color: getGraphColor(colorID, DataType.Meter)}
				});
			}
		}
	}


	for (const groupID of state.graph.selectedGroups) {
		const byGroupID = state.readings.bar.byGroupID[groupID];
		if (byGroupID !== undefined) {
			const readingsData = byGroupID[timeInterval.toString()][barDuration.toISOString()];
			if (readingsData !== undefined && !readingsData.isFetching) {
				const label = state.groups.byGroupID[groupID].name;
				const colorID = groupID;
				if (readingsData.readings === undefined) {
					throw new Error('Unacceptable condition: readingsData.readings is undefined.');
				}

				// Create two arrays for the x and y values. Fill the array with the data.
				const xData: string[] = [];
				const yData: number[] = [];
				const hoverText: string[] = [];
				const readings = _.orderBy(readingsData.readings, ['startTimestamp'], ['asc']);
				readings.forEach(barReading => {
					const timeReading: string =
						`${moment(barReading.startTimestamp).utc().format('LL')} - ${moment(barReading.endTimestamp).utc().format('LL')}`;
					xData.push(timeReading);
					yData.push(barReading.reading);
					hoverText.push(`<b> ${timeReading} </b> <br> ${label}: ${barReading.reading} kWh`);
				});

				// This variable contains all the elements (x and y values, bar chart, etc.) assigned to the data parameter of the Plotly object
				datasets.push({
					name: label,
					x: xData,
					y: yData,
					text: hoverText,
					hoverinfo: 'text',
					type: 'bar',
					marker: {color: getGraphColor(colorID, DataType.Group)}
				});
			}
		}
	}

	// Customize the layout of the plot
	const layout: any = {
		barmode: (state.graph.barStacking ? 'stack' : 'group'),
		bargap: 0.2, // Gap between different times of readings
		bargroupgap: 0.1, // Gap between different meter's readings under the same timestamp
		autosize: true,
		showlegend: true,
		legend: {
			x: 0,
			y: 1.1,
			orientation: 'h'
		},
		yaxis: {
			title: 'kWh',
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

	// Assign all the parameters required to create the Plotly object (data, layout, config) to the variable props, returned by mapStateToProps
	// The Plotly toolbar is displayed if displayModeBar is set to true (not for bar charts)
	const props: IPlotlyChartProps = {
		data: datasets,
		layout,
		config: {
			displayModeBar: false,
			locales: Locales // makes locales available for use
		}
	};
	props.config.locale = state.admin.defaultLanguage;
	return props;
}

export default connect(mapStateToProps)(PlotlyChart);
