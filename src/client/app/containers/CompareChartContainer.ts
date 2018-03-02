/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Bar, LinearComponentProps } from 'react-chartjs-2';
import { ChartData, ChartDataSets, LinearTickOptions } from 'chart.js';
import * as moment from 'moment';
import { connect } from 'react-redux';
import { TimeInterval } from '../../../common/TimeInterval';
// This is better than using an import, since we don't actually use anything from the plugin in the code.
/// <reference path="chartjs-plugin-datalabels" />
import { State } from '../types/redux/state';

interface ChartDataSetsWithDatalabels extends ChartDataSets {
	datalabels: {
		anchor: string;
		align: string;
	};
}

interface CompareChartContainerProps {
	id: number;
	isGroup: boolean;
}

function mapStateToProps(state: State, ownProps: CompareChartContainerProps) {
	const timeInterval = state.graph.compareTimeInterval.toString();
	const barDuration = state.graph.compareDuration.toISOString();
	const timeIntervalDurationInDays = TimeInterval.fromString(timeInterval).duration('days');
	const datasets: ChartDataSetsWithDatalabels[] = [];
	const labels: string[] = [];
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
		prevLabel = 'Last four weeks';
		currLabel = 'This four weeks';
	}
	const currLabelLowercase = currLabel.toLowerCase();

	// Compose the text to display to the user.
	let delta;
	if (ownProps.isGroup) {
		delta = (changeForText: number) => {
			if (isNaN(changeForText)) { return ''; }
			if (change < 0) {
				const name = state.groups.byGroupID[ownProps.id].name;
				return `${name} has used ${parseInt(change.toFixed(2).replace('.', '').slice(1))}% less energy ${currLabelLowercase}`;
			}
			return `${state.groups.byGroupID[ownProps.id].name} has used ${parseInt(change.toFixed(2).replace('.', ''))}% more energy ${currLabelLowercase}`;
		};
	} else {
		delta = (changeForText: number) => {
			if (isNaN(changeForText)) { return ''; }
			if (change < 0) {
				const name = state.meters.byMeterID[ownProps.id].name;
				return `${name} has used ${parseInt(change.toFixed(2).replace('.', '').slice(1))}% less energy ${currLabelLowercase}`;
			}
			return `${state.meters.byMeterID[ownProps.id].name} has used ${parseInt(change.toFixed(2).replace('.', ''))}% more energy ${currLabelLowercase}`;
		};
	}


	const colorize = (changeForColorization: number) => {
		if (changeForColorization < 0) {
			return 'green';
		}
		return 'red';
	};

	let readingsData: {isFetching: boolean, readings?: Array<[number, number]>} | undefined ;
	if (ownProps.isGroup) {
		const readingsDataByTimeInterval = state.readings.bar.byGroupID[ownProps.id][timeInterval];
		readingsData = readingsDataByTimeInterval[barDuration];
	} else {
		const readingsDataByTimeInterval = state.readings.bar.byMeterID[ownProps.id][timeInterval];
		readingsData = readingsDataByTimeInterval[barDuration];
	}
	if (readingsData !== undefined && !readingsData.isFetching && readingsData.readings !== undefined) {
		if (readingsData.readings.length < 7) {
			soFar = moment().hour();
		} else if (readingsData.readings.length <= 14) {
			soFar = moment().diff(moment().startOf('week'), 'days');
		} else {
			// 21 to differentiate from week case, week case never larger than 14
			soFar = moment().diff(moment().startOf('week').subtract(21, 'days'), 'days');
		}

		// Calculates current interval
		if (readingsData.readings.length < soFar) {
			throw new Error(`Insufficient readings data to process comparison for id ${ownProps.id}, ti ${timeInterval}, dur ${barDuration}.
				readingsData has ${readingsData.readings.length} but we'd like to look at the last ${soFar} elements.`);
		}
		for (let i = readingsData.readings.length - soFar; i < readingsData.readings.length; i++) {
			current += readingsData.readings[i][1];
		}
		// Calculate prev interval
		for (let i = 0; i < readingsData.readings.length - soFar; i++) {
			prev += readingsData.readings[i][1];
		}
		// Calculates current for previous time interval
		// Have to special case Sunday for week and four weeks
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
	datasets.push(
		{
			data: [prev, Math.round((current / currentPrev) * prev)],
			datalabels: {
				anchor: 'end',
				align: 'start'
			}
		}, {
			data: [currentPrev, current],
			datalabels: {
				anchor: 'end',
				align: 'start'
			}
		}
	);
	// sorts the data so that one doesn't cover up the other
	datasets.sort((a, b) => {
		if (a.data !== undefined && b.data !== undefined) {
			return +(a.data[0]) - +(b.data[0]);
		} else {
			return 0;
		}
	});


	// apply info to datasets after sort
	datasets[0].backgroundColor = [readingsBeforeCurrentTimeColor, readingsBeforeCurrentTimeColor];
	datasets[0].hoverBackgroundColor = [readingsBeforeCurrentTimeColor, readingsBeforeCurrentTimeColor];
	datasets[1].backgroundColor = [readingsAfterCurrentTimeColor, projectedDataColor];
	datasets[1].hoverBackgroundColor = [readingsAfterCurrentTimeColor, projectedDataColor];


	const data: ChartData = {datasets, labels};
	const change = (-1 + (((current / currentPrev) * prev) / prev));
	const ticks: LinearTickOptions = {
		beginAtZero: true
	};
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
				ticks
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
				formatter: (value: number) => `${value} kW`
			}
		}
	};


	const props: LinearComponentProps = {
		data,
		options,
		redraw: true
	};

	return props;
}


export default connect(mapStateToProps)(Bar);
