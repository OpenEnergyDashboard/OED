import React from 'react';
import UIOptionsComponent from './UIOptionsComponent';
import LineChartComponent from './LineChartComponent';
import BarChartComponent from './BarChartComponent';

export default function DashboardComponent() {
	const titleStyle = {
		textAlign: 'center'
	};
	return (
		<div className="container-fluid">
			<h1 style={titleStyle}>Environmental Dashboard</h1>
			<UIOptionsComponent />
			<LineChartComponent />
			<BarChartComponent />
		</div>
	);
}
