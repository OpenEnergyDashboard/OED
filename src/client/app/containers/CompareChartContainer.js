/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import _ from 'lodash';
import { Bar } from 'react-chartjs-2';
import moment from 'moment';
import { connect } from 'react-redux';
import GraphColors from '../utils/GraphColors';


/**
 * @param {State} state
 */
function mapStateToProps(state) {
	const timeInterval = state.graph.compareTimeInterval;
	const barDuration = state.graph.compareDuration;
	const data = { datasets: [] };
	const graphColors = new GraphColors();
	const labelsSet = new Set();
	const timeSet = new Set();
	let cw = 0;
	let lw = 0;
	let clw = 0;
	const soFar = moment().diff(moment().startOf('week'), 'days');
	console.log(soFar);
	for (const meterID of state.graph.selectedMeters) {
		const readingsData = state.readings.bar.byMeterID[meterID][timeInterval][barDuration];
		if (readingsData !== undefined && !readingsData.isFetching) {
		    // Converts unix time stamp to something nicer
			for (const element of _.flatten(readingsData.readings.map(arr => arr[0]))) {
				timeSet.add(`${moment(element).format('MMM DD, YYYY, hh:mm a')} - ${moment(element).add(barDuration).format('MMM DD, YYYY, hh:mm a')}`);
			}
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
			console.log(`current: ${cw}. current last week: ${clw}. Total last week: ${lw}. future: ${(cw / clw) * lw}`);
			labelsSet.add('Last week');
			labelsSet.add('This week');
			const color1 = graphColors.getColor();
			const color2 = graphColors.getColor();
			data.datasets.push({
				label: Array.from(timeSet)[readingsData.readings.length - 2],
				data: [lw, (cw / clw) * lw],
				backgroundColor: color1,
				hoverBackgroundColor: color1
			},
				{
					label: Array.from(timeSet)[readingsData.readings.length - 1],
					data: [clw, cw],
					backgroundColor: color2,
					hoverBackgroundColor: color2
				});
			// sorts the data so that one doesn't cover up the other
			data.datasets.sort((a, b) => a.data[0] - b.data[0]);

			// groups readings by meter
			// labelsSet.add(state.meters.byMeterID[meterID].name);
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
		tooltips: {
			mode: 'nearest',
			intersect: false,
			backgroundColor: 'rgba(0,0,0,0.6)',
			displayColors: false,
			callbacks: {
				label: tooltipItems => `${data.datasets[tooltipItems.datasetIndex].label}: ${tooltipItems.yLabel} kWh`
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
