import React from 'react';
import ReactHighcharts from 'react-highcharts';
import axios from 'axios';

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
					headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
					pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
					'<td style="padding:0"><b>{point.y:.1f} kWh</b></td></tr>',
					footerFormat: '</table>',
					shared: true,
					useHTML: true
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
					name: 'Meter readings',
					data: []
				}]
			}
		};
	}

	componentWillMount() {
		axios.get('/api/meters/readings/6')
			.then(response => {
				this.setState(prevState => {
					const seriesCopy = Object.assign({}, prevState.config.series[0]);
					seriesCopy.data = response.data;
					return {
						config: Object.assign({}, prevState.config, { series: [seriesCopy].concat(prevState.config.series.slice(1)) })
					};
				});
			})
			.catch(error => {
				console.log(error);
			});
	}

	render() {
		return (
			<div className="col-md-8">
				<ReactHighcharts config={this.state.config} />
			</div>
		);
	}
}
