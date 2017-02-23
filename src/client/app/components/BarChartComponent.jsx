/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import ReactHighcharts from 'react-highcharts';
import _ from 'lodash';

export default class BarChartComponent extends React.Component {
	/**
	 * Initializes the configuration object passed down to <ReactHighcharts />, a React wrapper library for Highcharts
	 * @param props The props passed down through BarChartContainer
	 */
	constructor(props) {
		super(props);
		this.state = {
			config: {
				chart: {
					type: 'column'
				},
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
					min: 0
				},
				tooltip: {
					valueSuffix: ' kWh'
				},
				plotOptions: {
					column: {
						pointPadding: 0.2,
						borderWidth: 0
					}
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
	 * 	Updates the chart's series with the new data received from BarChartContainer
	 * 	Sets the old config's series to [] to remove existing series before merging in the new data
	 * 	Deep cloning of the object is required to copy the full object
	 * 	@param nextProps The props received from BarChartContainer
	 */
	componentWillReceiveProps(nextProps) {
		this.setState(prevState => {
			const clonedState = _.cloneDeep(prevState);
			clonedState.config.series = [];
			return { config: _.merge(clonedState.config, { series: nextProps.series }) };
		});
	}


	/**
	 * @return JSX to create a bar chart with the given Highcharts config
	 */
	render() {
		return (
			<div className="col-xs-10">
				<ReactHighcharts config={this.state.config} />
			</div>
		);
	}
}
