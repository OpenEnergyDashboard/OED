import React from 'react';
import UIOptionsComponent from './UIOptionsComponent';
import LineChartContainer from '../containers/LineChartContainer';
import BarChartContainer from '../containers/BarChartContainer';

export default function DashboardComponent() {
	return (
		<div className="container-fluid">
			<UIOptionsComponent />
			<LineChartContainer />
			<BarChartContainer />
		</div>
	);
}
