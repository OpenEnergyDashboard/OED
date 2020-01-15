/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { Bar, ChartComponentProps } from 'react-chartjs-2';
import { ChartData, ChartDataSets, ChartTooltipItem } from 'chart.js';
import * as moment from 'moment';
import { connect } from 'react-redux';
import getGraphColor from '../utils/getGraphColor';
import { State } from '../types/redux/state';


function mapStateToProps(state: State) {
	const timeInterval = state.graph.timeInterval;
	const barDuration = state.graph.barDuration;
	const datasets: ChartDataSets[] = [];

	const labelsSet = new Set();
	for (const meterID of state.graph.selectedMeters) {
		const byMeterID = state.readings.bar.byMeterID[meterID];
		if (byMeterID !== undefined) {
			const readingsData = byMeterID[timeInterval.toString()][barDuration.toISOString()];
			if (readingsData !== undefined && readingsData.readings !== undefined && !readingsData.isFetching) {
				const label = state.meters.byMeterID[meterID].name;
				const color = getGraphColor(label);
				datasets.push({
					label,
					data: readingsData.readings.map(barReading => barReading.reading),
					backgroundColor: color,
					hoverBackgroundColor: color
				});
				// Add only the unique time intervals to the label set
				for (const barReading of readingsData.readings) {
					labelsSet.add(
						`${moment(barReading.startTimestamp).format('MMM DD, YYYY')} - ${moment(barReading.endTimestamp).format('MMM DD, YYYY')}`);
				}
			}
		}
	}

	for (const groupID of state.graph.selectedGroups) {
		const byGroupID = state.readings.bar.byGroupID[groupID];
		if (byGroupID !== undefined) {
			const readingsData = byGroupID[timeInterval.toString()][barDuration.toISOString()];
			if (readingsData !== undefined && readingsData.readings !== undefined && !readingsData.isFetching) {
				const label = state.groups.byGroupID[groupID].name;
				const color = getGraphColor(label);
				datasets.push({
					label,
					data: readingsData.readings.map(barReading => barReading.reading),
					backgroundColor: color,
					hoverBackgroundColor: color
				});
				// Add only the unique time intervals to the label set
				for (const barReading of readingsData.readings) {
					labelsSet.add(
						`${moment(barReading.startTimestamp).format('MMM DD, YYYY')} - ${moment(barReading.endTimestamp).format('MMM DD, YYYY')}`);
				}
			}
		}
	}

	// Converts the label set into an array for Chart.js and sorts the labels based on the first date of the time interval
	const labels = Array.from(labelsSet).sort((x, y) => {
		const t1 = moment(x.split(' - ')[0], 'MMM DD, YYYY').format('x');
		const t2 = moment(y.split(' - ')[0], 'MMM DD, YYYY').format('x');
		return +(t1) - +(t2);
	});

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
					min: 0
				}
			}]
		},
		tooltips: {
			mode: 'nearest',
			intersect: false,
			backgroundColor: 'rgba(0,0,0,0.6)',
			displayColors: false,
			callbacks: {
				label: (tooltipItems: ChartTooltipItem) => {
					if (tooltipItems.datasetIndex !== undefined) {
						return `${datasets[tooltipItems.datasetIndex].label}: ${Number(parseFloat(tooltipItems.yLabel || '0').toFixed(3))} kW`;
					} else {
						throw new Error('tooltipItems.datasetIndex was undefined in line chart tooltip label callback');
					}
				}
			}
		},
		plugins: {
			datalabels: {
				display: false
			}
		}
	};

	const data: ChartData = { datasets, labels };

	const props: ChartComponentProps =  {
		data,
		options,
		redraw: true
	};

	return props;
}

export default connect(mapStateToProps)(Bar);
