/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import _ from 'lodash';
import { Bar } from 'react-chartjs-2';
import moment from 'moment';
import { connect } from 'react-redux';
import getGraphColor from '../utils/getGraphColor';

/**
 * @param {State} state
 */
function mapStateToProps(state) {
	const timeInterval = state.graph.timeInterval;
	const barDuration = state.graph.barDuration;
	const data = { datasets: [] };

	const labelsSet = new Set();
	for (const meterID of state.graph.selectedMeters) {
		const byMeterID = state.readings.bar.byMeterID[meterID];
		if (byMeterID !== undefined) {
			const readingsData = byMeterID[timeInterval][barDuration];
			const lineReadings = state.readings.line.byMeterID[meterID][timeInterval];
			if (readingsData !== undefined && !readingsData.isFetching) {
				const label = state.meters.byMeterID[meterID].name;
				const color = getGraphColor(label);
				data.datasets.push({
					label,
					data: readingsData.readings.map(arr => arr[1]),
					backgroundColor: color,
					hoverBackgroundColor: color
				});
				// Add only the unique time intervals to the label set
				let last = 0;
				for (const element of _.flatten(lineReadings.readings.map(arr => arr[0]))) {
					last = Math.max(last, element);
				}
				for (const element of _.flatten(readingsData.readings.map(arr => arr[0]))) {
					const difference = moment(last).subtract(element);
					const nextInterval = Math.min(barDuration, difference);
					labelsSet.add(`${moment(element).format('MMM DD, YYYY')} - ${moment(element).add(nextInterval).format('MMM DD, YYYY')}`);
				}
			}
		}
	}

	for (const groupID of state.graph.selectedGroups) {
		const byGroupID = state.readings.bar.byGroupID[groupID];
		if (byGroupID !== undefined) {
			const readingsData = byGroupID[timeInterval][barDuration];
			const lineReadings = state.readings.line.byMeterID[groupID][timeInterval];
			if (readingsData !== undefined && !readingsData.isFetching) {
				const label = state.groups.byGroupID[groupID].name;
				const color = getGraphColor(label);
				data.datasets.push({
					label,
					data: readingsData.readings.map(arr => arr[1]),
					backgroundColor: color,
					hoverBackgroundColor: color
				});
				// Add only the unique time intervals to the label set
				let last = 0;
				for (const element of _.flatten(lineReadings.readings.map(arr => arr[0]))) {
					last = Math.max(last, element);
				}
				for (const element of _.flatten(readingsData.readings.map(arr => arr[0]))) {
					const difference = moment(last).subtract(element);
					const nextInterval = Math.min(barDuration, difference);
					labelsSet.add(`${moment(element).format('MMM DD, YYYY')} - ${moment(element).add(nextInterval).format('MMM DD, YYYY')}`);
				}
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
					labelString: 'kW'
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
				label: tooltipItems => `${data.datasets[tooltipItems.datasetIndex].label}: ${tooltipItems.yLabel} kW`
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
