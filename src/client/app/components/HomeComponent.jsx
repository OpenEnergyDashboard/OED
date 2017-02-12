import React from 'react';
import HeaderComponent from './HeaderComponent';
import DashboardContainer from '../containers/DashboardContainer';

export default function HomeComponent() {
	return (
		<div>
			<HeaderComponent renderLoginButton="true" />
			<DashboardContainer />
		</div>
	);
}
