/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import HeaderContainer from '../containers/HeaderContainer';
import DashboardContainer from '../containers/DashboardContainer';
import FooterComponent from '../components/FooterComponent';

/**
 * Top-level React component that controls the home page
 * @return JSX to create the home page
 */
export default function HomeComponent() {
	return (
		<div>
			<HeaderContainer />
			<DashboardContainer />
			<FooterComponent />
		</div>
	);
}
