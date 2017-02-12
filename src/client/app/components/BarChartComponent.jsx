import React from 'react';
import ReactHighcharts from 'react-highcharts';
import _ from 'lodash';

export default class BarChartComponent extends React.Component {
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

	componentWillReceiveProps(nextProps) {
		this.setState(prevState => ({ config: _.merge(prevState.config, { series: nextProps.series }) }));
	}

	render() {
		return (
			<div className="col-xs-10">
				<ReactHighcharts config={this.state.config} />
			</div>
		);
	}
}
