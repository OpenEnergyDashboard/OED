import React from 'react';
import { fetchGraphDataIfNeeded } from '../actions';
import UIOptionsContainer from '../containers/UIOptionsContainer';
import LineChartContainer from '../containers/LineChartContainer';
import BarChartContainer from '../containers/BarChartContainer';

export default class DashboardComponent extends React.Component {
	componentWillMount() {
		this.props.dispatch(fetchGraphDataIfNeeded());
	}

	static render() {
		return (
			<div className="container-fluid">
				<UIOptionsContainer />
				<LineChartContainer />
				<BarChartContainer />
			</div>
		);
	}
}
