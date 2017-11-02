/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { defaults } from 'chart.js';
import datalabels from 'chartjs-plugin-datalabels';
import * as React from 'react';
import BarChartContainer from '../containers/BarChartContainer';
import CompareChartContainer from '../containers/CompareChartContainer';
import LineChartContainer from '../containers/LineChartContainer';
import UIOptionsContainer from '../containers/UIOptionsContainer';
import { chartTypes } from '../reducers/graph';

// The plugin package doesn't have types, so we have to cheat here.
// tslint:disable-next-line no-string-literal
defaults.global["plugins"] = {datalabels: {display: false}};

/**
 * React component that controls the dashboard
 */
export default function DashboardComponent(props) {
	const divPadding = {
		paddingTop: '35px'
	};
	let ChartToRender = '';
	if (props.chartToRender === chartTypes.line) {
		 ChartToRender = LineChartContainer;
	} else if (props.chartToRender === chartTypes.compare) {
		ChartToRender = CompareChartContainer;
	} else {
		 ChartToRender = BarChartContainer;
	}

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
