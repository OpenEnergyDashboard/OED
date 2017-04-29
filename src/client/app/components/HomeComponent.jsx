/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import HeaderContainer from '../containers/HeaderContainer';
import DashboardContainer from '../containers/DashboardContainer';

/**
 * Top-level React component that controls the home page
 * @return JSX to create the home page
 */
export default class HomeComponent extends React.Component {
	constructor(props) {
		super(props);
		this.updateDimensions = this.updateDimensions.bind(this);
	}

	updateDimensions() {
		const documentElement = document.documentElement;
		const body = document.getElementsByTagName('body')[0];
		const width = window.innerWidth || documentElement.clientWidth || body.clientWidth;
		const height = window.innerHeight || documentElement.clientHeight || body.clientHeight;
		this.props.updateWindowDimensions({ width, height });
	}

	componentWillMount() {
		this.updateDimensions();
	}

	componentDidMount() {
		window.addEventListener('resize', this.updateDimensions);
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.updateDimensions);
	}

	render() {
		return (
			<div>
				<HeaderContainer renderLoginButton renderOptionsButton />
				<DashboardContainer />
			</div>
		);
	}
}
