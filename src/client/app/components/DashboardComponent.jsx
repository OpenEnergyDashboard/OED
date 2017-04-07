/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import UIOptionsContainer from '../containers/UIOptionsContainer';
import LineChartContainer from '../containers/LineChartContainer';
import BarChartContainer from '../containers/BarChartContainer';

/**
 * React component that controls the dashboard
 */
export default function DashboardComponent(props) {
	return (
		<div className="container-fluid">
			<UIOptionsContainer />
			<div className="col-xs-10">
				{props.chartToRender === 'line' ? <LineChartContainer /> : <BarChartContainer />}
			</div>
		</div>
	);
}
