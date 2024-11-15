/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useAppSelector } from '../redux/reduxHooks';
import { selectOptionsVisibility } from '../redux/slices/appStateSlice';
import { selectChartToRender } from '../redux/slices/graphSlice';
import { ChartTypes } from '../types/redux/graph';
import BarChartComponent from './BarChartComponent';
import LineChartComponent from './LineChartComponent';
import MapChartComponent from './MapChartComponent';
import MultiCompareChartComponent from './MultiCompareChartComponent';
import RadarChartComponent from './RadarChartComponent';
import ThreeDComponent from './ThreeDComponent';
import UIOptionsComponent from './UIOptionsComponent';
import PlotNavComponent from './PlotNavComponent';

/**
 * React component that controls the dashboard
 * @returns the Primary Dashboard Component comprising of Ui Controls, and
 */
export default function DashboardComponent() {
	const chartToRender = useAppSelector(selectChartToRender);
	const optionsVisibility = useAppSelector(selectOptionsVisibility);

	return (
		<div className='container-fluid flexGrowOne' >
			<div className='row' style={{ overflowY: 'hidden', height: '100%' }}>
				<div className={`${optionsVisibility ? 'col-2 d-none d-lg-block' : 'd-none'}`} style={{ height: '100%' }}>
					<UIOptionsComponent />
				</div>
				<div className={`${optionsVisibility ? 'col-12 col-lg-10' : 'col-12'} align-self-auto text-center`} style={{ height: '100%' }}>
					<div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
						<PlotNavComponent />
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


