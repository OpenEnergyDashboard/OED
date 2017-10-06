/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import _ from 'lodash';
import { Bar } from 'react-chartjs-2';
import moment from 'moment';
import { connect } from 'react-redux';
import datalabels from 'chartjs-plugin-datalabels';
import GraphColors from '../utils/GraphColors';


/**
 * @param {State} state
 */
function mapStateToProps(state) {
	const timeInterval = state.graph.compareTimeInterval;
	const barDuration = state.graph.compareDuration;
	const data = { datasets: [] };
	const labelsSet = new Set();
	let cw = 0;
	let lw = 0;
	let clw = 0;
	const soFar = moment().diff(moment().startOf('week'), 'days');
	for (const meterID of state.graph.selectedMeters) {
		const readingsData = state.readings.bar.byMeterID[meterID][timeInterval][barDuration];
		if (readingsData !== undefined && !readingsData.isFetching) {
			// Calculate cw
			for (let i = 1; i <= soFar; i++) {
				cw += readingsData.readings[readingsData.readings.length - i][1];
			}
			// Calculate lw
			for (let i = 0; i < 7; i++) {
				lw += readingsData.readings[readingsData.readings.length - (8 + i) - soFar][1];
			}

			// Calculate clw
			for (let i = 1; i <= soFar; i++) {
				clw += readingsData.readings[readingsData.readings.length - i - 7][1];
			}
			labelsSet.add('Last week');
			labelsSet.add('This week');
			const color1 = 'rgba(173, 216, 230, 1)';
			const color2 = 'rgba(218, 165, 32, 1)';
			const color3 = 'rgba(173, 216, 230, 0.5)';
			data.datasets.push({
				data: [lw, Math.round((cw / clw) * lw)],
				backgroundColor: [color1, color3],
				hoverBackgroundColor: [color1, color3],
				datalabels: {
					anchor: 'end',
					align: 'start',
				}
			},
				{
					data: [clw, cw],
					backgroundColor: color2,
					hoverBackgroundColor: color2,
					datalabels: {
						anchor: 'end',
						align: 'start',
					}
				});
			// sorts the data so that one doesn't cover up the other
			data.datasets.sort((a, b) => a.data[0] - b.data[0]);
		}
	}
    //
	data.labels = Array.from(labelsSet);

	const options = {
		animation: {
			duration: 0
		},
		elements: {
			point: {
				radius: 0
			}
		},
		scales: {
			xAxes: [{
				stacked: true,
				gridLines: {
					display: true
				}
			}],
			yAxes: [{
				stacked: false,
				scaleLabel: {
					display: true,
					labelString: 'kWh'
				},
				ticks: {
					beginAtZero: true
				}
			}]
		},
		legend: {
			display: false
		},
		 tooltips: {
			enabled: false
		 	},
		plugins: {
			datalabels: {
				color: 'black',
				font: {
					weight: 'bold'
				}
			}
		}
	};

	return {
		data,
		options,
		redraw: true
	};
}

export default connect(mapStateToProps)(Bar);
