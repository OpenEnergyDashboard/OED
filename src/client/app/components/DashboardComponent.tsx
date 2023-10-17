/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import MapChartContainer from '../containers/MapChartContainer';
import MultiCompareChartContainer from '../containers/MultiCompareChartContainer';
import { useAppSelector } from '../redux/hooks';
import { selectChartQueryArgs } from '../redux/selectors/dataSelectors';
import { ChartTypes } from '../types/redux/graph';
import BarChartComponent from './BarChartComponent';
import LineChartComponent from './LineChartComponent';
import ThreeDComponent from './ThreeDComponent';
import UIOptionsComponent from './UIOptionsComponent';
import HistoryComponent from './HistoryComponent';

/**
 * React component that controls the dashboard
 * @returns the Primary Dashboard Component comprising of Ui Controls, and
 */
export default function DashboardComponent() {
	const chartToRender = useAppSelector(state => state.graph.chartToRender);
	const optionsVisibility = useAppSelector(state => state.graph.optionsVisibility);
	const queryArgs = useAppSelector(state => selectChartQueryArgs(state))

	const optionsClassName = optionsVisibility ? 'col-2 d-none d-lg-block' : 'd-none';
	const chartClassName = optionsVisibility ? 'col-12 col-lg-10' : 'col-12';

	return (
		<div className='container-fluid'>
			<div className='row'>
				<div className={optionsClassName}>
					<UIOptionsComponent />
				</div>
				<div className={`${chartClassName} align-self-auto text-center`}>
					<div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
						<HistoryComponent />

						{chartToRender === ChartTypes.line && <LineChartComponent queryArgs={queryArgs.line} />}
						{chartToRender === ChartTypes.bar && <BarChartComponent queryArgs={queryArgs.bar} />}
						{chartToRender === ChartTypes.compare && <MultiCompareChartContainer />}
						{chartToRender === ChartTypes.map && <MapChartContainer />}
						{chartToRender === ChartTypes.threeD && <ThreeDComponent queryArgs={queryArgs.threeD} />}
					</div>

				</div>
			</div>
		</div >
	);
}


