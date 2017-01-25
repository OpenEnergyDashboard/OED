import React from 'react';
import ReactHighcharts from 'react-highcharts';
import axios from 'axios';

export default class ChartComponent extends React.Component {

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
						text: 'kWh/m'
					},
					plotLines: [{
						value: 0,
						width: 1,
						color: '#808080'
					}]
				},
				tooltip: {
					valueSuffix: ' kWh/m'
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
					name: 'Test data',
					data: []
				}]
			}
		};
	}

	componentWillMount() {
		axios.get('/api/meters/readings/3')
			.then(response => {
				const chart = this.chart;
				chart.series[0].setData(response.data);
			})
			.catch(error => {
				console.log(error);
			});
	}

	render() {
		return (
			<div className="col-md-8">
				<ReactHighcharts config={this.state.config} ref={c => { this.chart = c.chart;}} />
			</div>
		);
	}
}
