/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Line } from 'react-chartjs-2';
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
	const data = { datasets: [] };
	const graphColors = new GraphColors();

	for (const datasourceID of state.graph.selectedDatasources) {
		// Contains the actual data being displayed
		let readingsData = {};
		// Contains metainfo about the data being displayed
		let datasource = {};
		// Figure out which table to look up the data in, and do that.
		if (datasourceID.type === DATA_TYPE_METER) {
			datasource = state.meters.byMeterID[datasourceID.id];
			readingsData = state.readings.line.byMeterID[datasourceID.id][timeInterval];
		} else if (datasourceID.type === DATA_TYPE_GROUP) {
			datasource = state.groups.byGroupID[datasourceID.id];
			readingsData = state.readings.line.byGroupID[datasourceID.id][timeInterval];
		}

		if (readingsData !== undefined && !readingsData.isFetching) {
			data.datasets.push({
				label: datasource.name,
				data: readingsData.readings.map(arr => ({ x: arr[0], y: arr[1].toFixed(2) })),
				fill: false,
				borderColor: graphColors.getColor()
			});
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
				title: tooltipItems => `${moment(tooltipItems[0].xLabel).format('dddd, MMM DD, YYYY hh:mm a')}`,
				label: tooltipItems => `${data.datasets[tooltipItems.datasetIndex].label}: ${tooltipItems.yLabel} kWh`
			}
		},
		pan: {
			enabled: true,
			mode: 'x'
		},
		zoom: {
			enabled: true,
			mode: 'x',
		}
	};

	return {
		data,
		options,
		redraw: true
	};
}

export default connect(mapStateToProps)(Line);
