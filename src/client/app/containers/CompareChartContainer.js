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
	const timeInterval = state.graph.timeInterval;
	const barDuration = state.graph.barDuration;
	const data = { datasets: [] };
	const graphColors = new GraphColors();

	const labelsSet = new Set();
	for (const meterID of state.graph.selectedMeters) {
		const readingsData = state.readings.bar.byMeterID[meterID][timeInterval][barDuration];
		if (readingsData !== undefined && !readingsData.isFetching) {
			const color1 = graphColors.getColor();
			const color2 = graphColors.getColor();
			data.datasets.push({
				label: state.meters.byMeterID[meterID].name,
				data: [readingsData.readings[0][1],readingsData.readings[1][1]],
				backgroundColor: color1,
				hoverBackgroundColor: color1
			});
			// groups readings by meter
			labelsSet.add(state.meters.byMeterID[meterID].name);
			console.log(readingsData.readings[0][1]);
			console.log(readingsData.readings[1][1]);
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
				stacked: false,
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
