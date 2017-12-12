/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { defaults } from 'chart.js';
import UIOptionsContainer from '../containers/UIOptionsContainer';
import LineChartContainer from '../containers/LineChartContainer';
import BarChartContainer from '../containers/BarChartContainer';
import MultiCompareChartContainer from '../containers/MultiCompareChartContainer';
import { chartTypes } from '../reducers/graph';

/* tslint:disable no-string-literal */
// TODO TYPESCRIPT: There is an open PR for this: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/21842
defaults.global.plugins = {datalabels: {display: false}};
/* tslint:enable */

interface DashboardProps {
	chartToRender: chartTypes;
}

/**
 * React component that controls the dashboard
 */
export default function DashboardComponent(props: DashboardProps) {
	let ChartToRender: typeof LineChartContainer | typeof MultiCompareChartContainer | typeof BarChartContainer;
	if (props.chartToRender === chartTypes.line) {
		ChartToRender = LineChartContainer;
	} else if (props.chartToRender === chartTypes.compare) {
		ChartToRender = MultiCompareChartContainer;
	} else {
		ChartToRender = BarChartContainer;
	}

	return (
		<div className='container-fluid'>
			<div>
				<div className='col-xs-2 hidden-sm hidden-xs'>
					<UIOptionsContainer />
				</div>
				<div className='col-xs-10'>
					<ChartToRender />
				</div>
			</div>
		</div>
	);
}
