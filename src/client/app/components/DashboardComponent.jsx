import React from 'react';
import UIOptionsContainer from '../containers/UIOptionsContainer';
import NewLineChartContainer from '../containers/NewLineChartContainer';

export default class DashboardComponent extends React.Component {

	render() {
		return (
			<div className="container-fluid">
				<UIOptionsContainer />
				<NewLineChartContainer />
			</div>
		);
	}
}
