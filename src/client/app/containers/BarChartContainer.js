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
			const color = graphColors.getColor();
			data.datasets.push({
				label: state.meters.byMeterID[meterID].name,
				data: readingsData.readings.map(arr => arr[1]),
				backgroundColor: color,
				hoverBackgroundColor: color
			});
			// Add only the unique time intervals to the label set
			for (const element of _.flatten(readingsData.readings.map(arr => arr[0]))) {
				labelsSet.add(`${moment(element).format('MMM DD, YYYY')} - ${moment(element).add(barDuration).format('MMM DD, YYYY')}`);
			}
		}
	}
    // Converts the label set into an array for Chart.js and sorts the labels based on the first date of the time interval
	data.labels = Array.from(labelsSet).sort((x, y) => moment(x.split(' - ')[0], 'MMM DD, YYYY').format('x') - moment(y.split(' - ')[0], 'MMM DD, YYYY').format('x'));

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
				stacked: state.graph.barStacking,
				gridLines: {
					display: true
				}
			}],
			yAxes: [{
				stacked: state.graph.barStacking,
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
