/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { graphSlice } from '../reducers/graph';
import { Dispatch } from '../types/redux/actions';
import { ChartTypes } from '../types/redux/graph';
import { State } from '../types/redux/state';
import translate from '../utils/translate';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 *  A component that allows users to select which chart should be displayed.
 * @returns Chart select element
 */
export default function ChartSelectComponent() {
	const currentChartToRender = useSelector((state: State) => state.graph.chartToRender)
	const dispatch: Dispatch = useDispatch();
	const [expand, setExpand] = useState(false);

	// TODO Re-write as selector to use elsewhere
	// const sortedMaps = _.sortBy(_.values(useSelector((state: State) => state.maps.byMapID)).map(map => (
	// 	{ value: map.id, label: map.name, isDisabled: !(map.origin && map.opposite) } as SelectOption
	// )), 'label');

	return (
		<div style={divBottomPadding}>
			<p style={labelStyle}>
				<FormattedMessage id='graph.type' />:
				<TooltipMarkerComponent page='home' helpTextId='help.home.chart.select' />
			</p>
			<Dropdown isOpen={expand} toggle={() => setExpand(!expand)}>
				<DropdownToggle outline caret>
					<FormattedMessage id={currentChartToRender} />
				</DropdownToggle>
				<DropdownMenu>
					{
						// Make items for dropdown from enum
						Object.values(ChartTypes)
							// filter out current chart
							.filter(chartType => chartType !== currentChartToRender)
							// map to components
							.map(chartType =>
								<DropdownItem
									onClick={() => dispatch(graphSlice.actions.changeChartToRender(chartType))}
								>
									{translate(`${chartType}`)}
								</DropdownItem>
							)
					}
				</DropdownMenu>
			</Dropdown>
		</div >
	);
}
const divBottomPadding: React.CSSProperties = {
	paddingBottom: '15px'
};
const labelStyle: React.CSSProperties = {
	fontWeight: 'bold',
	margin: 0
};