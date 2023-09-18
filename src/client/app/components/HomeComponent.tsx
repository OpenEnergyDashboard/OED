/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import DashboardContainer from '../containers/DashboardContainer';
import FooterContainer from '../containers/FooterContainer';
import TooltipHelpContainer from '../containers/TooltipHelpContainer';
import HeaderComponent from './HeaderComponent';
import { metersApi } from '../redux/api/metersApi';
import { groupsApi } from '../redux/api/groupsApi';

/**
 * Top-level React component that controls the home page
 * @returns JSX to create the home page
 */
export default function HomeComponent() {
	// /api/unitReadings/threeD/meters/28?timeInterval=2020-05-08T00:00:00Z_2020-07-15T00:00:00Z&graphicUnitId=1&readingInterval=1
	metersApi.endpoints.getMeters.useQuery();
	groupsApi.endpoints.getGroups.useQuery();

	return (
		<div>
			<HeaderComponent />
			<TooltipHelpContainer page='home' />
			<DashboardContainer />
			<FooterContainer />
		</div>
	);
}
