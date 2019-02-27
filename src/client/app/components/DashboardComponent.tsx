/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { defaults } from 'chart.js';
import UIOptionsContainer from '../containers/UIOptionsContainer';
import LineChartContainer from '../containers/LineChartContainer';
import BarChartContainer from '../containers/BarChartContainer';
import MultiCompareChartContainer from '../containers/MultiCompareChartContainer';
import SpinnerComponent from './SpinnerComponent';
import { ChartTypes } from '../types/redux/graph';

defaults.plugins = {
	datalabels: {
		display: false
	}
};

interface DashboardProps {
	chartToRender: ChartTypes;
	optionsVisibility: boolean;
	lineLoading: false;
	barLoading: false;
	compareLoading: false;
}

/**
 * React component that controls the dashboard
 * @returns JSX code to render DashboardComponents.
 * TODO: confirm this.
 */
export default function DashboardComponent(props: DashboardProps) {
	let ChartToRender: typeof LineChartContainer | typeof MultiCompareChartContainer | typeof BarChartContainer;
	let showSpinner = false;
	if (props.chartToRender === ChartTypes.line) {
		if (props.lineLoading) {
			showSpinner = true;
		}
		ChartToRender = LineChartContainer;
	} else if (props.chartToRender === ChartTypes.bar) {
		if (props.barLoading) {
			showSpinner = true;
		}
		ChartToRender = BarChartContainer;
	} else {
		if (props.compareLoading) {
			showSpinner = true;
		}
		ChartToRender = MultiCompareChartContainer;
	}

	const optionsClassName = props.optionsVisibility ? 'col-2 d-none d-lg-block' : 'd-none';
	const chartClassName = props.optionsVisibility ? 'col-12 col-lg-10' : 'col-12';

	return (
		<div className='container-fluid'>
			<div className='row'>
				<div className={optionsClassName}>
					<UIOptionsContainer />
				</div>
				<div className={`${chartClassName} align-self-center text-center`}>
					{ showSpinner ? (
						<SpinnerComponent loading width={50} height={50} />
					) : (
						<ChartToRender />
					)}
				</div>
			</div>
		</div>
	);
}
