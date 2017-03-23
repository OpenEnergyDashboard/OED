/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Line } from 'react-chartjs-2';
import moment from 'moment';
import { connect } from 'react-redux';
import 'chartjs-plugin-zoom';

/**
 * @param {State} state
 */
function mapStateToProps(state) {
	const timeInterval = state.graph.timeInterval;
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
					data: state.readings.byMeterID[meterID][timeInterval].readings.map(arr => ({ x: arr[0], y: arr[1].toFixed(2) })),
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
			intersect: false,
			backgroundColor: 'rgba(0,0,0,0.6)',
			callbacks: {
				title: tooltipItems => `${moment(tooltipItems[0].xLabel).format('MMMM DD, YYYY hh:mm a')}`,
				label: tooltipItems => `${tooltipItems.yLabel} kWh`
			}
		},
		pan: {
			enabled: true,
			mode: 'x'
		},
		zoom: {
			enabled: true,
			mode: 'x',
		}
	};

	return {
		data,
		options,
		redraw: true
	};
}

export default connect(mapStateToProps)(Line);
