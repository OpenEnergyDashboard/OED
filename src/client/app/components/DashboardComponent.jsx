/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import UIOptionsContainer from '../containers/UIOptionsContainer';
import LineChartContainer from '../containers/LineChartContainer';
import BarChartContainer from '../containers/BarChartContainer';
import { chartTypes } from '../reducers/graph';

/**
 * React component that controls the dashboard
 */
export default function DashboardComponent(props) {
	const divPadding = {
		paddingTop: '35px'
	};
	const ChartToRender = (props.chartToRender === chartTypes.line) ? LineChartContainer : BarChartContainer;
	return (
		<div className="container-fluid">
			<div>
				<div className="col-xs-2 hidden-sm hidden-xs" style={divPadding}>
					<UIOptionsContainer />
				</div>
				<div className="col-xs-10">
					<ChartToRender />
				</div>
			</div>
		</div>
	);
}
