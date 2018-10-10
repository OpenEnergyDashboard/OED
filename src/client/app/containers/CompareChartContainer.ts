/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Bar, LinearComponentProps } from 'react-chartjs-2';
import { ChartData, ChartDataSets, LinearTickOptions, ChartTooltipItem } from 'chart.js';
import * as datalabels from 'chartjs-plugin-datalabels';
import { connect } from 'react-redux';
import { State } from '../types/redux/state';
import { getComparePeriodLabels, getCompareChangeSummary } from '../utils/calculateCompare';
import { CompareEntity } from './MultiCompareChartContainer';
import translate from '../utils/translate';

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
	entity: CompareEntity;
}

function mapStateToProps(state: State, ownProps: CompareChartContainerProps): LinearComponentProps {
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
			mode: 'nearest',
			intersect: false,
			backgroundColor: 'rgba(0,0,0,0.6)',
			displayColors: false,
			callbacks: {
				label: (tooltipItem: ChartTooltipItem, data: ChartData) => { // tslint:disable-line no-shadowed-variable
					const usage = tooltipItem.yLabel;
					const usedThisTime = data.datasets![0].data![0];
					const usedSoFar = data.datasets![0].data![1];
					const totalUsed = data.datasets![1].data![0];
					const labelText = tooltipItem.xLabel!.toLowerCase();
					switch (usage) {
						case usedThisTime:
							return `${usage} kW ${translate('used.this.time')} ${labelText}`;
						case usedSoFar:
							return `${usage} kW ${translate('used.so.far')} ${labelText}`;
						case totalUsed:
							return `${usage} kW ${translate('total')} ${labelText}`;
						default:
							return `${usage} kW ${translate('projected.to.be.used')} ${labelText}`;
					}
				},
				title: () => ''
			}
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

// Escape from TypeScript here. TypeScript doesn't like the fact that Bar is non typed.
const barConstructor: any = Bar;
export default connect(mapStateToProps)(barConstructor);
