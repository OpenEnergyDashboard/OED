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


/* This takes the current state of the map and turns it into a provider, I think. A provider
*   will alert our Redux app when there has been a change in state, and this will re-render our React
* app (from internet). 
*
*  This takes a state. Gets the time interval and bar duration of that state. 
*  Connects React and Redux. Simplifies component state as a subset of the application
*  state, so it can better comply with redux pattern. I don't super know what that means
*  but I've done a lot of googling and it makes the most sense so far.
*
*  Practically, it keeps performance high.
*/

function mapStateToProps(state: State) {
	const timeInterval = state.graph.timeInterval;
	const barDuration = state.graph.barDuration;
	const datasets: ChartDataSets[] = [];

	const labelsSet = new Set();
	for (const meterID of state.graph.selectedMeters) {
		const byMeterID = state.readings.bar.byMeterID[meterID];
		if (byMeterID !== undefined) {
			// gets data at current time interval/barDuration
			const readingsData = byMeterID[timeInterval.toString()][barDuration.toISOString()];
			// If it's undefined and isFetching, we can get the label, color and then push the datasets
			// to the chart? This makes no sense to me.
			if (readingsData !== undefined && readingsData.readings !== undefined && !readingsData.isFetching) {
				const label = state.meters.byMeterID[meterID].name;
				const color = getGraphColor(label);
				datasets.push({
					label,
					data: readingsData.readings.map(arr => arr[1]),
					backgroundColor: color,
					hoverBackgroundColor: color
				});
				// Add only the unique time intervals to the label set
				for (const element of _.flatten(readingsData.readings.map(arr => arr[0]))) {
					labelsSet.add(`${moment(element).format('MMM DD, YYYY')} - ${moment(element).add(barDuration).format('MMM DD, YYYY')}`);
				}
			}
		}
	}

	// Find data for the groups that the user has selected, and then do the same as above
	for (const groupID of state.graph.selectedGroups) {
		const byGroupID = state.readings.bar.byGroupID[groupID];
		if (byGroupID !== undefined) {
			const readingsData = byGroupID[timeInterval.toString()][barDuration.toISOString()];
			if (readingsData !== undefined && readingsData.readings !== undefined && !readingsData.isFetching) {
				const label = state.groups.byGroupID[groupID].name;
				const color = getGraphColor(label);
				datasets.push({
					label,
					data: readingsData.readings.map(arr => arr[1]),
					backgroundColor: color,
					hoverBackgroundColor: color
				});
				// Add only the unique time intervals to the label set
				for (const element of _.flatten(readingsData.readings.map(arr => arr[0]))) {
					labelsSet.add(`${moment(element).format('MMM DD, YYYY')} - ${moment(element).add(barDuration).format('MMM DD, YYYY')}`);
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


// styling for the chart
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
						return `${datasets[tooltipItems.datasetIndex].label}: ${tooltipItems.yLabel} kW`;
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
