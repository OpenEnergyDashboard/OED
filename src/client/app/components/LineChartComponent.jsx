/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';
import ReactHighstock from 'react-highcharts/ReactHighstock';
import _ from 'lodash';
import TimeInterval from '../../../common/TimeInterval';

const defaultConfig = {
	title: {
		text: null
	},
	scrollbar: {
		liveRedraw: false
	},
	xAxis: {
		type: 'datetime',
		dateTimeLabelFormats: {
			month: '%b \'%y',
			year: '%b'
		},
		title: {
			text: 'Date'
		}
	},
	yAxis: {
		title: {
			text: 'kWh'
		},
		plotLines: [{
			value: 0,
			width: 1,
			color: '#808080'
		}]
	},
	tooltip: {
		valueSuffix: ' kWh'
	},
	legend: {
		layout: 'vertical',
		align: 'right',
		verticalAlign: 'middle',
		borderWidth: 0
	},
	credits: {
		enabled: false
	},
	series: [{
		name: '',
		data: []
	}]
};

class ReduxLineChartComponent extends React.Component {

	constructor(props) {
		super(props);
		this.onChartExtremesChange = this.onChartExtremesChange.bind(this);
		this.setupChartRef = this.setupChartRef.bind(this);
		this.state = {
			config: _.merge({}, defaultConfig, { xAxis: { events: { afterSetExtremes: this.onChartExtremesChange } } })
		};
	}

	shouldComponentUpdate() {
		// We're interfacing with a library that doesn't support react here, so we need to suppress react updates and
		// handle them ourselves in componentWillReceiveProps
		return false;
	}

	componentWillReceiveProps(nextProps) {
		for (const meterID of nextProps.notLoadedMeters) {
			nextProps.fetchNewReadings(meterID, nextProps.timeInterval);
		}
		this.updateChartForNewProps(nextProps);
	}

	updateChartSeriesForNewProps(nextProps) {
		const oldSelectedMeterIDs = Object.keys(this.props.series);
		const newSelectedMeterIDs = Object.keys(nextProps.series);

		const meterIDsToRemove = _.without(oldSelectedMeterIDs, ...newSelectedMeterIDs);
		const meterIDsToAdd = _.without(newSelectedMeterIDs, ...oldSelectedMeterIDs);
		const meterIDsToChange = _.intersection(oldSelectedMeterIDs, newSelectedMeterIDs);

		let shouldRedraw = false;
		for (const meterID of meterIDsToRemove) {
			this.chart.get(meterID).remove(false);
			shouldRedraw = true;
		}
		for (const meterID of meterIDsToAdd) {
			this.chart.addSeries({
				id: meterID,
				name: nextProps.series[meterID].name,
				data: nextProps.series[meterID].data,
				showInNavigator: true
			}, false);
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

	updateChartForNewProps(nextProps) {
		if (nextProps.isLoading !== this.props.isLoading) {
			if (nextProps.isLoading) {
				this.chart.showLoading('Loading...');
			} else {
				this.chart.hideLoading();
			}
		}

		let shouldRedraw = this.updateChartSeriesForNewProps(nextProps);

		if (nextProps.title !== this.props.title) {
			this.chart.setTitle({
				text: nextProps.title
			}, false);
			shouldRedraw = true;
		}

		if (shouldRedraw) {
			this.chart.redraw();
		}
	}

	setupChartRef(chart) {
		// This fixes https://facebook.github.io/react/docs/refs-and-the-dom.html#legacy-api-string-refs
		// React calls this twice during DOM updates, and once it's null. We need to check this to avoid
		// a null pointer exception.
		if (chart !== null) {
			this.chart = chart.getChart();
		}
	}

	onChartExtremesChange({ min, max }) {
		min = (min && Math.round(min)) || null;
		max = (max && Math.round(max)) || null;
		const timeInterval = new TimeInterval(min, max);
		for (const meterID of this.props.selectedMeters) {
			this.props.fetchNewReadings(meterID, timeInterval);
		}
		// this.props.fetchManyNewReadings(this.props.selectedMeters, min, max);
	}

	render() {
		return (
			<div className="col-xs-10">
				<ReactHighstock config={this.state.config} ref={this.setupChartRef} />
			</div>
		);
	}
}

export default ReduxLineChartComponent;
