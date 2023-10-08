/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import ReactTooltip from 'react-tooltip';
import ExportComponent from '../components/ExportComponent';
import ChartLinkContainer from '../containers/ChartLinkContainer';
import { useAppSelector } from '../redux/hooks';
import { ChartTypes } from '../types/redux/graph';
import AreaUnitSelectComponent from './AreaUnitSelectComponent';
import BarControlsComponent from './BarControlsComponent';
import ChartDataSelectComponentWIP from './ChartDataSelectComponentWIP';
import ChartSelectComponent from './ChartSelectComponent';
import CompareControlsComponent from './CompareControlsComponent';
import DateRangeComponent from './DateRangeComponent';
import ErrorBarComponent from './ErrorBarComponent';
import GraphicRateMenuComponent from './GraphicRateMenuComponent';
import MapControlsComponent from './MapControlsComponent';
import ThreeDSelectComponent from './ReadingsPerDaySelectComponent';
import { graphSlice } from '../reducers/graph';

/**
 * @returns the Ui Control panel
 */
export default function UIOptionsComponent() {
	const chartToRender = useAppSelector(state => graphSlice.selectors.chartToRender(state));
	ReactTooltip.rebuild();
	return (
		<div>
			<ChartSelectComponent />
			<ChartDataSelectComponentWIP />
			<GraphicRateMenuComponent />
			<ThreeDSelectComponent />
			<DateRangeComponent />

			<AreaUnitSelectComponent />
			{ /* Controls error bar, specifically for the line chart. */
				chartToRender === ChartTypes.line && <ErrorBarComponent />}

			{	/* Controls specific to the bar chart. */
				chartToRender === ChartTypes.bar && <BarControlsComponent />}

			{	/* Controls specific to the compare chart */
				chartToRender === ChartTypes.compare && <CompareControlsComponent />}

			{	/* Controls specific to the compare chart */
				chartToRender === ChartTypes.map && <MapControlsComponent />}


			{/* We can't export compare data or map data */
				chartToRender !== ChartTypes.compare && chartToRender !== ChartTypes.map && chartToRender !== ChartTypes.threeD &&
				< div style={divTopPadding}>
					<ExportComponent />
				</div>}

			<div style={divTopPadding}>
				<ChartLinkContainer />
			</div>
		</div >
	);
}
const divTopPadding: React.CSSProperties = {
	paddingTop: '15px'
};
