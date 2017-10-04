/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import _ from 'lodash';
import { Bar } from 'react-chartjs-2';
import moment from 'moment';
import { connect } from 'react-redux';
import 'chartjs-plugin-zoom';
import GraphColors from '../utils/GraphColors';
import { DATA_TYPE_GROUP, DATA_TYPE_METER } from '../utils/Datasources';

/**
 * @param {State} state
 */
function mapStateToProps(state) {
	const timeInterval = state.graph.timeInterval;
	const barDuration = state.graph.barDuration;
	const data = { datasets: [] };
	const graphColors = new GraphColors();

	const labelsSet = new Set();
	for (const datasourceID of state.graph.selectedDatasources) {
		// Contains the actual data being displayed
		let readingsData = {};
		// Contains metainfo about the data being displayed
		let datasource = {};
		// Figure out which table to look up the data in, and do that.
		if (datasourceID.type === DATA_TYPE_METER) {
			datasource = state.meters.byMeterID[datasourceID.id];
			readingsData = state.readings.bar.byMeterID[datasourceID.id][timeInterval][barDuration];
		} else if (datasourceID.type === DATA_TYPE_GROUP) {
			datasource = state.groups.byGroupID[datasourceID.id];
			readingsData = state.readings.bar.byGroupID[datasourceID.id][timeInterval][barDuration];
		}

		if (readingsData !== undefined && !readingsData.isFetching) {
			const color = graphColors.getColor();
			data.datasets.push({
				label: datasource.name,
				data: readingsData.readings.map(arr => arr[1]),
				backgroundColor: color,
				hoverBackgroundColor: color
			});
			// Add only the unique time intervals to the label set
			for (const element of _.flatten(readingsData.readings.map(arr => arr[0]))) {
				labelsSet.add(`${moment(element).format('MMM DD, YYYY, hh:mm a')} - ${moment(element).add(barDuration).format('MMM DD, YYYY, hh:mm a')}`);
			}
		}
	}
    // Converts the label set into an array for Chart.js and sorts the labels based on the first date of the time interval
	data.labels = Array.from(labelsSet).sort((x, y) => moment(x.split(' - ')[0], 'MMM DD, YYYY, hh:mm a').format('x') - moment(y.split(' - ')[0], 'MMM DD, YYYY, hh:mm a').format('x'));

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
			displayColors: false,
			callbacks: {
				label: tooltipItems => `${data.datasets[tooltipItems.datasetIndex].label}: ${tooltipItems.yLabel} kWh`
			}
		}
	};

	return {
		data,
		options,
		redraw: true
	};
}

export default connect(mapStateToProps)(Bar);
