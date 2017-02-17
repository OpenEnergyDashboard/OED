import React from 'react';
import ReactHighstock from 'react-highcharts/ReactHighstock';
import _ from 'lodash';

export default class LineChartComponent extends React.Component {
	/**
	 * Initializes the configuration object passed down to <ReactHighcharts />, a React wrapper library for Highcharts
	 * @param props The props passed down through LineChartContainer
	 */
	constructor(props) {
		super(props);
		this.state = {
			config: {
				title: {
					text: null
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
			}
		};
	}

	/**
	 * 	Updates the chart's series with the new data received from LineChartContainer
	 * 	Sets the old config's series to [] to remove existing series before merging in the new data
	 * 	Deep cloning of the object is required to copy the full object
	 * 	@param nextProps The props received from LineChartContainer
	 */
	componentWillReceiveProps(nextProps) {
		this.setState(prevState => {
			const clonedState = _.cloneDeep(prevState);
			clonedState.config.series = [];
			return { config: _.merge(clonedState.config, { series: nextProps.series }) };
		});
	}

	/**
	 * @returns JSX to create a line chart with the given Highcharts config
	 */
	render() {
		return (
			<div className="col-xs-10">
				<ReactHighstock config={this.state.config} />
			</div>
		);
	}
}
