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
	navigator: {
		adaptToUpdatedData: false
	},
	series: [{
		name: '',
		data: []
	}]
};

export default class LineChartComponent extends React.Component {

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
		this.updateChartForNewProps(nextProps);
	}

	updateChartSeriesForNewProps(nextProps) {
		const mainID = id => `main-${id}`;

		const oldSelectedMeterIDs = Object.keys(this.props.series);
		const newSelectedMeterIDs = Object.keys(nextProps.series);

		const meterIDsToRemove = _.without(oldSelectedMeterIDs, ...newSelectedMeterIDs);
		const meterIDsToAdd = _.without(newSelectedMeterIDs, ...oldSelectedMeterIDs);
		const meterIDsToChange = _.intersection(oldSelectedMeterIDs, newSelectedMeterIDs);

		let shouldRedraw = false;
		for (const meterID of meterIDsToRemove) {
			this.chart.get(mainID(meterID)).remove(false);
			shouldRedraw = true;
		}
		for (const meterID of meterIDsToAdd) {
			this.chart.addSeries({
				id: mainID(meterID),
				name: nextProps.series[meterID].name,
				data: nextProps.series[meterID].data,
				showInNavigator: false
			}, false);
			shouldRedraw = true;
		}
		for (const meterID of meterIDsToChange) {
			const oldSeriesData = this.props.series[meterID];
			const newSeriesData = nextProps.series[meterID];
			if (!(_.isEqual(oldSeriesData, newSeriesData))) {
				const series = this.chart.get(mainID(meterID));
				series.setData(newSeriesData.data);
				shouldRedraw = true;
			}
		}

		const navID = id => `nav-${id}`;

		const oldSelectedNavigatorMeterIDs = Object.keys(this.props.navigatorSeries);
		const newSelectedNavigatorMeterIDs = Object.keys(nextProps.navigatorSeries);

		const navigatorMeterIDsToRemove = _.without(oldSelectedNavigatorMeterIDs, ...newSelectedNavigatorMeterIDs);
		const navigatorMeterIDsToAdd = _.without(newSelectedNavigatorMeterIDs, ...oldSelectedNavigatorMeterIDs);
		const navigatorMeterIDsToChange = _.intersection(oldSelectedNavigatorMeterIDs, newSelectedNavigatorMeterIDs);

		for (const meterID of navigatorMeterIDsToRemove) {
			this.chart.get(navID(meterID)).remove(false);
			shouldRedraw = true;
		}
		for (const meterID of navigatorMeterIDsToAdd) {
			this.chart.addSeries({
				id: navID(meterID),
				name: nextProps.navigatorSeries[meterID].name,
				data: nextProps.navigatorSeries[meterID].data,
				showInNavigator: true,
				enableMouseTracking: false,
				lineWidth: 0,
				marker: {
					enabled: false,
					states: {
						hover: {
							enabled: false
						}
					}
				}
			}, false);
			shouldRedraw = true;
		}
		for (const meterID of navigatorMeterIDsToChange) {
			const oldSeriesData = this.props.navigatorSeries[meterID];
			const newSeriesData = nextProps.navigatorSeries[meterID];
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
		if (this.props.isLoading) {
			return;
		}
		min = (min && Math.round(min)) || null;
		max = (max && Math.round(max)) || null;
		const timeInterval = new TimeInterval(min, max);
		this.props.onGraphZoomChange(timeInterval);
	}

	render() {
		return (
			<div className="col-xs-10">
				<ReactHighstock config={this.state.config} ref={this.setupChartRef} />
			</div>
		);
	}
}
