/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Bar } from 'react-chartjs-2';
import moment from 'moment';
import { connect } from 'react-redux';
import datalabels from 'chartjs-plugin-datalabels'; // eslint-disable-line no-unused-vars
import TimeInterval from '../../../common/TimeInterval';


function mapStateToProps(state, ownProps) {
	const timeInterval = state.graph.compareTimeInterval;
	const barDuration = state.graph.compareDuration;
	const timeIntervalDurationInDays = TimeInterval.fromString(timeInterval).duration('days');
	const data = { datasets: [] };
	const labels = [];
	// Power used so far this week
	let current = 0;
	// Last week total usage
	let prev = 0;
	// Power used up to this point last week
	let currentPrev = 0;
	// How long it's been since start of measure period
	let soFar;

	let prevLabel;
	let currLabel;
	if (timeIntervalDurationInDays < 7) {
		prevLabel = 'Yesterday';
		currLabel = 'Today';
	} else if (timeIntervalDurationInDays >= 7 && timeIntervalDurationInDays < 14) {
		prevLabel = 'Last week';
		currLabel = 'This week';
	} else {
		prevLabel = 'Last month';
		currLabel = 'This month';
	}
	const currLabelLowercase = currLabel.toLowerCase();

	// Compose the text to display to the user.
	let delta;
	if (ownProps.isGroup) {
		delta = change => {
			if (isNaN(change)) return '';
			if (change < 0) return `${state.groups.byGroupID[ownProps.id].name} has used ${parseInt(change.toFixed(2).replace('.', '').slice(1))}% less energy ${currLabelLowercase}`;
			return `${state.groups.byGroupID[ownProps.id].name} has used ${parseInt(change.toFixed(2).replace('.', ''))}% more energy ${currLabelLowercase}`;
		};
	} else {
		delta = change => {
			if (isNaN(change)) return '';
			if (change < 0) return `${state.meters.byMeterID[ownProps.id].name} has used ${parseInt(change.toFixed(2).replace('.', '').slice(1))}% less energy ${currLabelLowercase}`;
			return `${state.meters.byMeterID[ownProps.id].name} has used ${parseInt(change.toFixed(2).replace('.', ''))}% more energy ${currLabelLowercase}`;
		};
	}


	const colorize = change => {
		if (change < 0) {
			return 'green';
		}
		return 'red';
	};

	let readingsData;
	if (ownProps.isGroup) {
		readingsData = state.readings.bar.byGroupID[ownProps.id][timeInterval][barDuration];
	}	else {
		readingsData = state.readings.bar.byMeterID[ownProps.id][timeInterval][barDuration];
	}
	if (readingsData !== undefined && !readingsData.isFetching) {
		if (readingsData.readings.length < 7) {
			soFar = moment().hour();
		} else if (readingsData.readings.length <= 14) {
			soFar = moment().diff(moment().startOf('week'), 'days');
		} else {
			// 21 to differentiate from week case, week case never larger than 14
			soFar = moment().diff(moment().startOf('week').subtract(21, 'days'), 'days');
		}

		// Calculates current interval
		for (let i = readingsData.readings.length - soFar; i < readingsData.readings.length; i++) {
			current += readingsData.readings[i][1];
		}
		// Calculate prev interval
		for (let i = 0; i < readingsData.readings.length - soFar; i++) {
			prev += readingsData.readings[i][1];
		}
		// Calculates current for previous time interval
		// Have to special case Sunday for week and month
		if (soFar === 0) {
			currentPrev = Math.round((readingsData.readings[0][1] / 24) * moment().hour());
		} else {
			for (let i = 0; i < soFar; i++) {
				currentPrev += readingsData.readings[i][1];
			}
		}
	}

	labels.push(prevLabel);
	labels.push(currLabel);
	const readingsAfterCurrentTimeColor = 'rgba(173, 216, 230, 1)';
	const readingsBeforeCurrentTimeColor = 'rgba(218, 165, 32, 1)';
	const projectedDataColor = 'rgba(173, 216, 230, 0.45)';
	data.datasets.push(
		{
			data: [prev, Math.round((current / currentPrev) * prev)],
			datalabels: {
				anchor: 'end',
				align: 'start',
			}
		}, {
			data: [currentPrev, current],
			datalabels: {
				anchor: 'end',
				align: 'start',
			}
		}
	);
	// sorts the data so that one doesn't cover up the other
	data.datasets.sort((a, b) => a.data[0] - b.data[0]);

	// apply info to datasets after sort
	data.datasets[0].backgroundColor = [readingsBeforeCurrentTimeColor, readingsBeforeCurrentTimeColor];
	data.datasets[0].hoverBackgroundColor = [readingsBeforeCurrentTimeColor, readingsBeforeCurrentTimeColor];
	data.datasets[1].backgroundColor = [readingsAfterCurrentTimeColor, projectedDataColor];
	data.datasets[1].hoverBackgroundColor = [readingsAfterCurrentTimeColor, projectedDataColor];
	data.labels = labels;

	const change = (-1 + (((current / currentPrev) * prev) / prev));

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
					labelString: 'kW'
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
			text: delta(change),
			fontColor: colorize(change)
		},
		plugins: {
			datalabels: {
				color: 'black',
				font: {
					weight: 'bold'
				},
				display: true,
				formatter: value => `${value} kW`
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
