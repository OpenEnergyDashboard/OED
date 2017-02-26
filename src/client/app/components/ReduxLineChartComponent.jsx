import React from 'react';
import ReactHighstock from 'react-highcharts/ReactHighstock';
import _ from 'lodash';

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


/*
	Props looks like
	{
		title: string,
		isLoading: boolean,
		series: {
			name: [series],
			name2: [series]
		}
	}
	TODO: Set up data fetching and setExtremes callback.
*/

class ReduxLineChartComponent extends React.Component {

	constructor(props) {
		super(props);
		this.onChartExtremesChange = this.onChartExtremesChange.bind(this);
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
			console.log(`Fetching readings for meter ${meterID}, time range ${nextProps.startTimestamp} - ${nextProps.endTimestamp}`);
			nextProps.fetchNewReadings(meterID, nextProps.startTimestamp, nextProps.endTimestamp);
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
			this.chart.get(meterID).remove();
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

	onChartExtremesChange({ min, max }) {
		console.log(`Extremes change. min: ${min} max: ${max}`);
		min = Math.round(min);
		max = Math.round(max);
		for (const meterID of this.props.selectedMeters) {
			// console.log(`Fetching for meter ${meterID}, min ${min}, max ${max}`);
			this.props.fetchNewReadings(meterID, min, max);
		}
	}

	render() {
		// TODO: There's some sort of problem with the interaction between refs and react-router, especially when returning to the chart
		return (
			<div className="col-xs-10">
				<ReactHighstock config={this.state.config} ref={chart => { this.chart = chart.getChart(); }} />
			</div>
		);
	}
}

export default ReduxLineChartComponent;
