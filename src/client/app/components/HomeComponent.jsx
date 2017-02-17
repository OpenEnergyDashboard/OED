import React from 'react';
import HeaderComponent from './HeaderComponent';
import DashboardContainer from '../containers/DashboardContainer';

/**
 * Top-level React component that controls the home page
 * @return JSX to create the home page
 */
export default function HomeComponent() {
	return (
		<div>
			<HeaderComponent renderLoginButton="true" />
			<DashboardContainer />
		</div>
	);
}
