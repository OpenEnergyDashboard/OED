/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useAppSelector } from '../redux/reduxHooks';
import { ChartTypes } from '../types/redux/graph';
import BarChartComponent from './BarChartComponent';
import HistoryComponent from './HistoryComponent';
import LineChartComponent from './LineChartComponent';
import MapChartComponent from './MapChartComponent';
import MultiCompareChartComponent from './MultiCompareChartComponent';
import ThreeDComponent from './ThreeDComponent';
import UIOptionsComponent from './UIOptionsComponent';
import { selectChartToRender } from '../redux/slices/graphSlice';
import { selectOptionsVisibility } from '../redux/slices/appStateSlice';
import RadarChartComponent from './RadarChartComponent';

/**
 * React component that controls the dashboard
 * @returns the Primary Dashboard Component comprising of Ui Controls, and
 */
export default function DashboardComponent() {
	const chartToRender = useAppSelector(selectChartToRender);
	const optionsVisibility = useAppSelector(selectOptionsVisibility);
	const optionsClassName = optionsVisibility ? 'col-2 d-none d-lg-block' : 'd-none';
	const chartClassName = optionsVisibility ? 'col-12 col-lg-10' : 'col-12';

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
						{chartToRender === ChartTypes.compare && <MultiCompareChartComponent />}
						{chartToRender === ChartTypes.map && <MapChartComponent />}
						{chartToRender === ChartTypes.threeD && <ThreeDComponent />}
						{chartToRender === ChartTypes.radar && <RadarChartComponent />}
					</div>

				</div>
			</div>
		</div >
	);
}


