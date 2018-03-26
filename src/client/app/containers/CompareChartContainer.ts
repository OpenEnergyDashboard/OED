/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Bar, LinearComponentProps } from 'react-chartjs-2';
import { ChartData, ChartDataSets, LinearTickOptions } from 'chart.js';
import { connect } from 'react-redux';
import { State } from '../types/redux/state';
import {getComparePeriodLabels, getCompareChangeSummary} from '../utils/calculateCompare';
import { Entity } from '../containers/MultiCompareChartContainer';

interface ChartDataSetsWithDatalabels extends ChartDataSets {
	datalabels: {
		anchor: string;
		align: string;
	};
}

interface CompareChartContainerProps {
	entity: Entity;
}

function mapStateToProps(state: State, ownProps: CompareChartContainerProps) {
	const comparePeriod = state.graph.comparePeriod;
	const datasets: ChartDataSetsWithDatalabels[] = [];
	const labels: string[] = [];

	const periodLabels = getComparePeriodLabels(comparePeriod);

	const colorize = (changeForColorization: number) => {
		if (changeForColorization < 0) {
			return 'green';
		}
		return 'red';
	};
	// Compose the text to display to the user.
	const entity = ownProps.entity;
	const changeSummary = getCompareChangeSummary(entity.change, entity.name, periodLabels);

	labels.push(periodLabels.prev);
	labels.push(periodLabels.current);
	const readingsAfterCurrentTimeColor = 'rgba(173, 216, 230, 1)';
	const readingsBeforeCurrentTimeColor = 'rgba(218, 165, 32, 1)';
	const projectedDataColor = 'rgba(173, 216, 230, 0.45)';
	datasets.push(
		{
			data: [entity.lastPeriodTotalUsage, Math.round((entity.currentPeriodUsage / entity.usedToThisPointLastTimePeriod) * entity.lastPeriodTotalUsage)],
			datalabels: {
				anchor: 'end',
				align: 'start'
			}
		}, {
			data: [entity.usedToThisPointLastTimePeriod, entity.currentPeriodUsage],
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
			fontColor: colorize(entity.change)
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
