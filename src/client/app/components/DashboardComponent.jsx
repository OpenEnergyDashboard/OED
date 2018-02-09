/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { defaults } from 'react-chartjs-2';
import UIOptionsContainer from '../containers/UIOptionsContainer';
import LineChartContainer from '../containers/LineChartContainer';
import BarChartContainer from '../containers/BarChartContainer';
import MultiCompareChartContainer from '../containers/MultiCompareChartContainer';
import { chartTypes } from '../reducers/graph';

defaults.global.plugins.datalabels.display = false;

/**
 * React component that controls the dashboard
 */
export default function DashboardComponent(props) {
	let ChartToRender = '';
	if (props.chartToRender === chartTypes.line) {
		ChartToRender = LineChartContainer;
	} else if (props.chartToRender === chartTypes.compare) {
		ChartToRender = MultiCompareChartContainer;
	} else {
		ChartToRender = BarChartContainer;
	}

	return (
		<div className="container-fluid">
			<div className="row">
				<div className="col-2 d-none d-lg-block">
					<UIOptionsContainer />
				</div>
				<div className="col-12 col-lg-10">
					<ChartToRender />
				</div>
			</div>
		</div>
	);
}
