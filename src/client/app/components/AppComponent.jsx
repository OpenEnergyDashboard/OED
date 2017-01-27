import React from 'react';
import DashboardComponent from './DashboardComponent';
import LogoComponent from './LogoComponent';

export default function AppComponent() {
	return (
		<div>
			<LogoComponent url="./app/images/logo.png" />
			<DashboardComponent />
		</div>
	);
}
