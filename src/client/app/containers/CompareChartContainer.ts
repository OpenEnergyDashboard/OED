/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Bar, LinearComponentProps } from 'react-chartjs-2';
import { ChartData, ChartDataSets, LinearTickOptions } from 'chart.js';
import * as moment from 'moment';
import { connect } from 'react-redux';
import { State } from '../types/redux/state';
import * as datalabels from 'chartjs-plugin-datalabels';
import {
	ComparePeriod,
	calculateCompareDuration,
	calculateCompareTimeInterval,
	getComparePeriodLabels,
	getCompareChangeSummary
} from '../utils/calculateCompare';

if (datalabels === null || datalabels === undefined) {
	throw new Error('Datalabels plugin was tree-shaken out.');
}

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
	const comparePeriod = state.graph.comparePeriod;
	const timeInterval = state.graph.compareTimeInterval;
	console.log(timeInterval);
	const barDuration = calculateCompareDuration(comparePeriod);

	// The name of the entity for which compare data is being computed.
	let name;
	if (ownProps.isGroup) {
		name = state.groups.byGroupID[ownProps.id].name;
	} else {
		name = state.meters.byMeterID[ownProps.id].name;
	}

	const datasets: ChartDataSetsWithDatalabels[] = [];
	const labels: string[] = [];
	// Power used so far this Week
	let currentPeriodUsage = 0;
	// Last Week total usage
	let lastPeriodTotalUsage = 0;
	// Power used up to this point last Week
	let usedToThisPointLastTimePeriod = 0;
	// How long it's been since start of measure period
	let timeSincePeriodStart;

	const periodLabels = getComparePeriodLabels(comparePeriod);

	const colorize = (changeForColorization: number) => {
		if (changeForColorization < 0) {
			return 'green';
		}
		return 'red';
	};

	let readingsData: { isFetching: boolean, readings?: Array<[number, number]> } | undefined ;
	if (ownProps.isGroup) {
		const readingsDataByID = state.readings.bar.byGroupID[ownProps.id];
		const readingsDataByTimeInterval = readingsDataByID[timeInterval.toString()];
		readingsData = readingsDataByTimeInterval[barDuration.toISOString()];
	} else {
		const readingsDataByID = state.readings.bar.byMeterID[ownProps.id];
		const readingsDataByTimeInterval = readingsDataByID[timeInterval.toString()];
		readingsData = readingsDataByTimeInterval[barDuration.toISOString()];
	}
	if (readingsData !== undefined && !readingsData.isFetching && readingsData.readings !== undefined) {
		if (state.graph.comparePeriod === ComparePeriod.Day) {
			timeSincePeriodStart = moment().hour();
		} else if (state.graph.comparePeriod === ComparePeriod.Week) {
			timeSincePeriodStart = moment().diff(moment().startOf('week'), 'days');
		} else {
			// 21 to differentiate from Week case, Week case never larger than 14
			timeSincePeriodStart = moment().diff(moment().startOf('week').subtract(21, 'days'), 'days');
		}

		// Calculates current interval
		if (readingsData.readings.length < timeSincePeriodStart) {
			throw new Error(`Insufficient readings data to process comparison for id ${ownProps.id}, ti ${timeInterval}, dur ${barDuration}.
				readingsData has ${readingsData.readings.length} but we'd like to look at the last ${timeSincePeriodStart} elements.`);
		}
		for (let i = readingsData.readings.length - timeSincePeriodStart; i < readingsData.readings.length; i++) {
			currentPeriodUsage += readingsData.readings[i][1];
		}
		// Calculate prev interval
		for (let i = 0; i < readingsData.readings.length - timeSincePeriodStart; i++) {
			lastPeriodTotalUsage += readingsData.readings[i][1];
		}
		// Calculates current for previous time interval
		// Have to special case Sunday for Week and FourWeeks
		if (timeSincePeriodStart === 0) {
			usedToThisPointLastTimePeriod = Math.round((readingsData.readings[0][1] / 24) * moment().hour());
		} else {
			for (let i = 0; i < timeSincePeriodStart; i++) {
				usedToThisPointLastTimePeriod += readingsData.readings[i][1];
			}
		}
	}

	// Compute the change between periods.
	const change = (-1 + (((currentPeriodUsage / usedToThisPointLastTimePeriod) * lastPeriodTotalUsage) / lastPeriodTotalUsage));

	// Compose the text to display to the user.
	const changeSummary = getCompareChangeSummary(change, name, periodLabels);

	labels.push(periodLabels.prev);
	labels.push(periodLabels.current);
	const readingsAfterCurrentTimeColor = 'rgba(173, 216, 230, 1)';
	const readingsBeforeCurrentTimeColor = 'rgba(218, 165, 32, 1)';
	const projectedDataColor = 'rgba(173, 216, 230, 0.45)';
	datasets.push(
		{
			data: [lastPeriodTotalUsage, Math.round((currentPeriodUsage / usedToThisPointLastTimePeriod) * lastPeriodTotalUsage)],
			datalabels: {
				anchor: 'end',
				align: 'start'
			}
		}, {
			data: [usedToThisPointLastTimePeriod, currentPeriodUsage],
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
			text: changeSummary,
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
