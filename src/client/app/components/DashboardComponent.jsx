import React from 'react';
import UIOptionsContainer from '../containers/UIOptionsContainer';
import LineChartContainer from '../containers/LineChartContainer';
import BarChartContainer from '../containers/BarChartContainer';

export default function DashboardComponent() {
	return (
		<div className="container-fluid">
			<UIOptionsContainer />
			<LineChartContainer />
			<BarChartContainer />
		</div>
	);
}
