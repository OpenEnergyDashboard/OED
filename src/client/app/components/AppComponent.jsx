import React from 'react';
import DashboardComponent from './DashboardComponent';
import LogoComponent from './LogoComponent';

export default class AppComponent extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div>
				<LogoComponent url="../old-mockup/images/logo.png" />
				<DashboardComponent />
			</div>
		);
	}
}
