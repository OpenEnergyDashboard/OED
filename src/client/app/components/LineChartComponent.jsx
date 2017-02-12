import React from 'react';
import ReactHighstock from 'react-highcharts/ReactHighstock';
import { fetchGraphDataIfNeeded } from '../actions';
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
		this.setState(prevState => ({ config: _.merge(prevState.config, { series: [{ data: response.data }] }) }));
	}

	render() {
		return (
			<div className="col-xs-10">
				<ReactHighstock config={this.state.config} />
			</div>
		);
	}
}
