import React from 'react';
import { Link } from 'react-router';
import UIOptionsComponent from './UIOptionsComponent';
import LineChartComponent from './LineChartComponent';
import BarChartComponent from './BarChartComponent';

export default function DashboardComponent() {
	const linkStyle = {
		float: 'right',
		marginRight: '75px'
	};
	return (
		<div className="container-fluid">
			<UIOptionsComponent />
			<button className="btn btn-default"><Link style={linkStyle} to="/login">Login</Link></button>
			<LineChartComponent />
			<BarChartComponent />
		</div>
	);
}
