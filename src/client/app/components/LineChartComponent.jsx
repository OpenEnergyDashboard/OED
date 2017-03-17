/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';
import { Line as LineChart } from 'react-chartjs-2';
import _ from 'lodash';

const chartOptions = {
	legend: {
		display: false,
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
	}
};

const chartData = {
	datasets: [
		{
			hidden: false
		}
	]
};

export default class LineChartComponent extends React.Component {
	constructor(props) {
		super(props);
		this.setupChartRef = this.setupChartRef.bind(this);
	}

	componentWillReceiveProps(nextProps) {
		for (const meterID of nextProps.notLoadedMeters) {
			nextProps.fetchNewReadings(meterID, nextProps.startTimestamp, nextProps.endTimestamp);
		}
		if (nextProps.isLoading !== this.props.isLoading) {
			if (nextProps.isLoading) {
				// TODO Chartjs way of showLoading
				// this.chart.showLoading('Loading...');
			} else {
				// this.chart.hideLoading();
			}
		}
		let shouldRedraw = this.updateChartSeriesForNewProps(nextProps);
		if (nextProps.title !== this.props.title) {
			// TODO set chart title to nextProps.title
			shouldRedraw = true;
		}
		if (shouldRedraw) {
			this.chart.update();
		}
	}

	updateChartSeriesForNewProps(nextProps) {
		const oldSelectedMeterIDs = Object.keys(this.props.series);
		const newSelectedMeterIDs = Object.keys(nextProps.series);

		const meterIDsToRemove = _.without(oldSelectedMeterIDs, ...newSelectedMeterIDs);
		const meterIDsToAdd = _.without(newSelectedMeterIDs, ...oldSelectedMeterIDs);
		const meterIDsToChange = _.intersection(oldSelectedMeterIDs, newSelectedMeterIDs);

		let shouldRedraw;
		for (const meterID of meterIDsToRemove) {
			this.chart.get(meterID).remove(false);
			shouldRedraw = true;
		}
		for (const meterID of meterIDsToAdd) {
			// TODO this only adds one dataset
			this.chart.config.data = {
				datasets: [{
					label: nextProps.series[meterID].name,
					data: nextProps.series[meterID].data.map(arr => ({ x: arr[0], y: arr[1] }))
				}],
				labels: []
			};
			shouldRedraw = true;
		}
		for (const meterID of meterIDsToChange) {
			const oldSeriesData = this.props.series[meterID];
			const newSeriesData = nextProps.series[meterID];
			if (!(_.isEqual(oldSeriesData, newSeriesData))) {
				const series = this.chart.get(meterID);
				series.setData(newSeriesData.data);
				shouldRedraw = true;
			}
		}
		return shouldRedraw;
	}

	setupChartRef(chart) {
		if (chart !== null) {
			this.chart = chart.chart_instance;
		}
	}

	render() {
		return (
			<div className="col-xs-10">
				<LineChart data={chartData} options={chartOptions} ref={this.setupChartRef} />
			</div>
		);
	}
}
