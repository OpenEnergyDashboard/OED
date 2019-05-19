/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { Line, ChartComponentProps } from 'react-chartjs-2';
import { ChartData, ChartDataSets, ChartPoint, ChartTooltipItem } from 'chart.js';
import * as moment from 'moment';
import { connect } from 'react-redux';
import getGraphColor from '../utils/getGraphColor';
import { State } from '../types/redux/state';
import {CompressedLineReading} from '../types/compressed-readings';


function compressedReadingToChartPoint(compressedReading: CompressedLineReading): ChartPoint {
	return { x: compressedReading.startTimestamp, y: compressedReading.reading };
}

function mapStateToProps(state: State) {
	const timeInterval = state.graph.timeInterval;
	const datasets: ChartDataSets[] = [];

	// Add all meters data to the chart
	for (const meterID of state.graph.selectedMeters) {
		const byMeterID = state.readings.line.byMeterID[meterID];
		if (byMeterID !== undefined) {
			const readingsData = byMeterID[timeInterval.toString()];
			if (readingsData !== undefined && !readingsData.isFetching) {
				const label = state.meters.byMeterID[meterID].name;
				if (readingsData.readings === undefined) {
					throw new Error('Unacceptable condition: readingsData.readings is undefined.');
				}

				const dataPoints: ChartPoint[] = _.values(readingsData.readings).map(compressedReadingToChartPoint);

				datasets.push({
					label,
					data: dataPoints,
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
			const readingsData = byGroupID[timeInterval.toString()];
			if (readingsData !== undefined && !readingsData.isFetching) {
				const label = state.groups.byGroupID[groupID].name;
				if (readingsData.readings === undefined) {
					throw new Error('Unacceptable condition: readingsData.readings is undefined.');
				}

				const dataPoints: ChartPoint[] = _.values(readingsData.readings).map(compressedReadingToChartPoint);

				datasets.push({
					label,
					data: dataPoints,
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
				title: (tooltipItems: ChartTooltipItem[]) => `${moment(tooltipItems[0].xLabel).format('dddd, MMM DD, YYYY hh:mm a')}`,
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

	const data: ChartData = { datasets };

	const props: ChartComponentProps = {
		data,
		options,
		redraw: true
	};

	return props;
}

export default connect(mapStateToProps)(Line);
