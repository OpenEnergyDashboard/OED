import React from 'react';
import ReactHighcharts from 'react-highcharts';
import { fetchGraphDataIfNeeded } from '../actions';

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

	componentWillMount() {
		this.props.dispatch(fetchGraphDataIfNeeded());
	}

	componentWillReceiveProps(nextProps) {
		this.setState(prevState => {
			const seriesCopy = Object.assign({}, prevState.config.series[0]);
			seriesCopy.data = nextProps.data;
			seriesCopy.name = `Meter ${nextProps.meterID}`;
			return {
				config: Object.assign({}, prevState.config, { series: [seriesCopy].concat(prevState.config.series.slice(1)) })
			};
		});
	}

	render() {
		return (
			<div className="col-xs-10">
				<ReactHighcharts config={this.state.config} />
			</div>
		);
	}
}
