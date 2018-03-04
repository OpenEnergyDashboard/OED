/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { defaults } from 'chart.js';
import UIOptionsContainer from '../containers/UIOptionsContainer';
import LineChartContainer from '../containers/LineChartContainer';
import BarChartContainer from '../containers/BarChartContainer';
import MultiCompareChartContainer from '../containers/MultiCompareChartContainer';
import { ChartTypes } from '../types/redux/graph';

defaults.plugins = {datalabels: {display: false}};

interface DashboardProps {
	chartToRender: ChartTypes;
	hideOptions: boolean;
}

/**
 * React component that controls the dashboard
 */
export default function DashboardComponent(props: DashboardProps) {
	let ChartToRender: typeof LineChartContainer | typeof MultiCompareChartContainer | typeof BarChartContainer;
	if (props.chartToRender === ChartTypes.line) {
		ChartToRender = LineChartContainer;
	} else if (props.chartToRender === ChartTypes.compare) {
		ChartToRender = MultiCompareChartContainer;
	} else {
		ChartToRender = BarChartContainer;
	}

	const optionsClassName = !props.hideOptions ? 'col-2 d-none d-lg-block' : 'd-none';
	const chartClassName = !props.hideOptions ? 'col-12 col-lg-10' : 'col-12';

	return (
		<div className='container-fluid'>
			<div className='row'>
				<div className={optionsClassName}>
					<UIOptionsContainer />
				</div>
				<div className={chartClassName}>
					<ChartToRender />
				</div>
			</div>
		</div>
	);
}
