/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import UIOptionsContainer from '../containers/UIOptionsContainer';
import NewLineChartContainer from '../containers/LineChartContainer';

/**
 * React component that controls the dashboard
 */
export default function DashboardComponent() {
	return (
		<div className="container-fluid">
			<UIOptionsContainer />
			<NewLineChartContainer />
		</div>
	);
}
