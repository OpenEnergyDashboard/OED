import React from 'react';
import HeaderComponent from './HeaderComponent';
import DashboardComponent from './DashboardComponent';

export default function HomeComponent() {
	return (
		<div>
			<HeaderComponent renderLoginButton="true" />
			<DashboardComponent />
		</div>
	);
}
