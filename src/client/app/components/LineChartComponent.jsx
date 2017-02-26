import React from 'react';
import ReactHighstock from 'react-highcharts/ReactHighstock';
import axios from 'axios';
import _ from 'lodash';

export default class LineChartComponent extends React.Component {
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
					name: 'Meter readings',
					data: []
				}]
			}
		};
	}

	componentWillMount() {
		axios.get('/api/meters/readings/6')
			.then(response => {
				this.setState(prevState => ({config: _.merge(prevState.config, {series: [{data: response.data}]})}));
			})
			.catch(error => {
				console.log(error);
			});
	}

	render() {
		return (
			<div className="col-xs-11">
				<ReactHighstock config={this.state.config}/>
			</div>
		);
	}
}
