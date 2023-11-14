/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useAppSelector } from '../redux/hooks';
import { ChartTypes } from '../types/redux/graph';
import BarChartComponent from './BarChartComponent';
import HistoryComponent from './HistoryComponent';
import LineChartComponent from './LineChartComponent';
import MapChartComponent from './MapChartComponent';
import MultiCompareChartComponentWIP from './MultiCompareChartComponentWIP';
import ThreeDComponent from './ThreeDComponent';
import UIOptionsComponent from './UIOptionsComponent';

/**
 * React component that controls the dashboard
 * @returns the Primary Dashboard Component comprising of Ui Controls, and
 */
export default function DashboardComponent() {
	const chartToRender = useAppSelector(state => state.graph.chartToRender);
	const optionsVisibility = useAppSelector(state => state.graph.optionsVisibility);
	const optionsClassName = optionsVisibility ? 'col-2 d-none d-lg-block' : 'd-none';
	const chartClassName = optionsVisibility ? 'col-12 col-lg-10' : 'col-12';
	// const optionsClassName = optionsVisibility ? 'col-3 d-none d-lg-block' : 'd-none';
	// const chartClassName = optionsVisibility ? 'col-12 col-lg-9' : 'col-12';

	return (
		<div className='container-fluid'>
			<div className='row'>
				<div className={optionsClassName}>
					<UIOptionsComponent />
				</div>
				<div className={`${chartClassName} align-self-auto text-center`}>
					<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
						<HistoryComponent />
						{chartToRender === ChartTypes.line && <LineChartComponent />}
						{chartToRender === ChartTypes.bar && <BarChartComponent />}
						{chartToRender === ChartTypes.compare && <MultiCompareChartComponentWIP />}
						{chartToRender === ChartTypes.map && <MapChartComponent />}
						{chartToRender === ChartTypes.threeD && <ThreeDComponent />}
					</div>

				</div>
			</div>
		</div >
	);
}


