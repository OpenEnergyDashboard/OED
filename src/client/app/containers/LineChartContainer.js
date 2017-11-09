/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Line } from 'react-chartjs-2';
import moment from 'moment';
import { connect } from 'react-redux';
import getGraphColor from '../utils/getGraphColor';

/**
 * @param {State} state
 */
function mapStateToProps(state) {
	const timeInterval = state.graph.timeInterval;
	const data = { datasets: [] };

	// Add all meters data to the chart
	for (const meterID of state.graph.selectedMeters) {
		const byMeterID = state.readings.line.byMeterID[meterID];
		if (byMeterID !== undefined) {
			const readingsData = byMeterID[timeInterval];
			if (readingsData !== undefined && !readingsData.isFetching) {
				const label = state.meters.byMeterID[meterID].name;
				data.datasets.push({
					label,
					data: readingsData.readings.map(arr => ({ x: arr[0], y: arr[1].toFixed(2) })),
					fill: false,
					borderColor: getGraphColor(label)
				});
			}
		}
	}

	// Add all groups data to the chart
	for (const groupID of state.graph.selectedGroups) {
		const byGroupID = state.readings.line.byGroupID[groupID];
		if (byGroupID !== undefined) {
			const readingsData = byGroupID[timeInterval];
			if (readingsData !== undefined && !readingsData.isFetching) {
				const label = state.groups.byGroupID[groupID].name;
				data.datasets.push({
					label,
					data: readingsData.readings.map(arr => ({ x: arr[0], y: arr[1].toFixed(2) })),
					fill: false,
					borderColor: getGraphColor(label)
				});
			}
		}
	}

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
				type: 'time'
			}],
			yAxes: [{
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
				title: tooltipItems => `${moment(tooltipItems[0].xLabel).format('dddd, MMM DD, YYYY hh:mm a')}`,
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

export default connect(mapStateToProps)(Line);
