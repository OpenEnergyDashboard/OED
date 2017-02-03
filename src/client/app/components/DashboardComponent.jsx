import React from 'react';
import UIOptionsComponent from './UIOptionsComponent';
import LineChartComponent from './LineChartComponent';
import BarChartComponent from './BarChartComponent';

export default function DashboardComponent() {
	return (
		<div className="container-fluid">
			<UIOptionsComponent />
			<LineChartComponent />
			<BarChartComponent />
		</div>
	);
}
