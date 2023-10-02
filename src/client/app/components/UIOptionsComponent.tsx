/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import ExportComponent from '../components/ExportComponent';
import ChartLinkContainer from '../containers/ChartLinkContainer';
import { graphSlice } from '../reducers/graph';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectChartToRender } from '../redux/selectors/uiSelectors';
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
import TooltipMarkerComponent from './TooltipMarkerComponent';
import ReactTooltip from 'react-tooltip';

/**
 * @returns the Ui Control panel
 */
export default function UIOptionsComponent() {
	const dispatch = useAppDispatch()
	const chartToRender = useAppSelector(state => selectChartToRender(state));
	const optionsVisibility = useAppSelector(state => state.graph.optionsVisibility);
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
				</div>
			}
			<div style={divTopPadding}>
				<ChartLinkContainer />
			</div>

			<div style={divTopPadding} className='d-none d-lg-block'>
				<Button
					onClick={() => dispatch(graphSlice.actions.toggleOptionsVisibility())}
					outline
				>
					{optionsVisibility ?
						<FormattedMessage id='hide.options' />
						:
						<FormattedMessage id='show.options' />
					}
				</Button>
				<TooltipMarkerComponent page='home' helpTextId='help.home.hide.or.show.options' />
			</div>
		</div >
	);
}
const divTopPadding: React.CSSProperties = {
	paddingTop: '15px'
};
