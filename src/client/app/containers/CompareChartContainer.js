/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Bar } from 'react-chartjs-2';
import moment from 'moment';
import { connect } from 'react-redux';
import datalabels from 'chartjs-plugin-datalabels'; // eslint-disable-line no-unused-vars


/**
 * @param {State} state
 */
function mapStateToProps(state, ownProps) {
	const timeInterval = state.graph.compareTimeInterval;
	const barDuration = state.graph.compareDuration;
	const data = { datasets: [] };
	const labels = [];
	// Power used so far this week
	let currentWeek = 0;
	// Last week total usage
	let lastWeek = 0;
	// Power used up to this point last week
	let currentLastWeek = 0;
	const soFar = moment().diff(moment().startOf('week'), 'days');

	// Compose the text to display to the user.
	const delta = change => {
		if (isNaN(change)) return ''; if (change < 0) return `${state.meters.byMeterID[ownProps.id].name} has used ${parseInt(change.toFixed(2).replace('.', '').slice(1))}% less energy this week.`;
		return `${state.meters.byMeterID[ownProps.id].name} has used ${parseInt(change.toFixed(2).replace('.', ''))}% more energy this week.`;
	};
	const colorize = change => {
		if (change < 0) {
			return 'green';
		}
		return 'red';
	};
	const readingsData = state.readings.bar.byMeterID[ownProps.id][timeInterval][barDuration];
	if (readingsData !== undefined && !readingsData.isFetching) {
		// Sunday needs special logic
		if (soFar !== 0) {
			// Calculate currentWeek
			for (let i = 1; i <= soFar; i++) {
				currentWeek += readingsData.readings[readingsData.readings.length - i][1];
			}
			// Calculate lastWeek
			for (let i = 0; i < 7; i++) {
				lastWeek += readingsData.readings[readingsData.readings.length - (8 + i) - soFar][1];
			}

			// Calculate currentLastWeek
			for (let i = 1; i <= soFar; i++) {
				currentLastWeek += readingsData.readings[readingsData.readings.length - i - 7][1];
			}
		} else {
			currentWeek = readingsData.readings[readingsData.readings.length - 1][1];
			// Data is acquired in days so when less than a day has passed we need to estimate
			currentLastWeek = Math.round((readingsData.readings[readingsData.readings.length - 8][1] / 24) * moment().hour());
			for (let i = 0; i < 7; i++) {
				lastWeek += readingsData.readings[readingsData.readings.length - 7][1];
			}
		}
		labels.push('Last week');
		labels.push('This week');
		const color1 = 'rgba(173, 216, 230, 1)';
		const color2 = 'rgba(218, 165, 32, 1)';
		const color3 = 'rgba(173, 216, 230, 0.45)';
		data.datasets.push(
			{
				data: [lastWeek, Math.round((currentWeek / currentLastWeek) * lastWeek)],
				backgroundColor: [color1, color3],
				hoverBackgroundColor: [color1, color3],
				datalabels: {
					anchor: 'end',
					align: 'start',
				}
			}, {
				data: [currentLastWeek, currentWeek],
				backgroundColor: color2,
				hoverBackgroundColor: color2,
				datalabels: {
					anchor: 'end',
					align: 'start',
				}
			}
		);
		// sorts the data so that one doesn't cover up the other
		data.datasets.sort((a, b) => a.data[0] - b.data[0]);
	}
	data.labels = labels;

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
		title: {
			display: true,
			text: delta((-1 + (((currentWeek / currentLastWeek) * lastWeek) / lastWeek))),
			fontColor: colorize((-1 + (((currentWeek / currentLastWeek) * lastWeek) / lastWeek)))
		},
		plugins: {
			datalabels: {
				color: 'black',
				font: {
					weight: 'bold'
				},
				display: true,
				formatter: value => `${value} kWh`
			},
		}
	};


	return {
		data,
		options,
		redraw: true
	};
}

export default connect(mapStateToProps)(Bar);
