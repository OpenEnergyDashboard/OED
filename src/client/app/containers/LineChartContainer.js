/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Line } from 'react-chartjs-2';
import { connect } from 'react-redux';
import { fetchReadingsIfNeeded } from '../actions/readings';
import { stringifyTimeInterval } from '../util';

/**
 * @param {State} state
 */
function mapStateToProps(state) {
	const startTimestamp = state.graph.startTimestamp;
	const endTimestamp = state.graph.endTimestamp;
	const timeInterval = stringifyTimeInterval(startTimestamp, endTimestamp);
	const data = { datasets: [] };
	const colors = ['LightBlue', 'GoldenRod', 'Black', 'OrangeRed', 'LightSeaGreen', 'LightSlateGray', 'Purple'];
	let colorPointer = 0;

	function getColor() {
		const color = colors[colorPointer];
		colorPointer = (colorPointer + 1) % colors.length;
		return color;
	}

	for (const meterID of state.graph.selectedMeters) {
		if (!(state.readings.byMeterID[meterID][timeInterval] === undefined || state.readings.byMeterID[meterID][timeInterval].isFetching)) {
			if (state.readings.byMeterID[meterID][timeInterval] !== undefined) {
				data.datasets.push({
					label: state.meters.byMeterID[meterID].name,
					data: state.readings.byMeterID[meterID][timeInterval].readings.map(arr => ({ x: arr[0], y: arr[1] })),
					fill: false,
					borderColor: getColor()
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
					labelString: 'kWh'
				},
				ticks: {
					beginAtZero: true
				}
			}]
		},
		tooltips: {
			mode: 'nearest',
			intersect: false
		}
	};

	return {
		data,
		options,
		redraw: true
	};
}

function mapDispatchToProps(dispatch) {
	return {
		fetchNewReadings: (meterID, startTimestamp, endTimestamp) => dispatch(fetchReadingsIfNeeded(meterID, startTimestamp, endTimestamp))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(Line);
