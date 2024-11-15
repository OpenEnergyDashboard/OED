/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { values } from 'lodash';
import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { graphSlice, selectChartToRender } from '../redux/slices/graphSlice';
import { SelectOption } from '../types/items';
import { ChartTypes } from '../types/redux/graph';
import { State } from '../types/redux/state';
import { useTranslate } from '../redux/componentHooks';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import { selectSelectedLanguage } from '../redux/slices/appStateSlice';

/**
 *  A component that allows users to select which chart should be displayed.
 * @returns Chart select element
 */
export default function ChartSelectComponent() {
	const translate = useTranslate();
	const currentChartToRender = useAppSelector(selectChartToRender);
	const locale = useAppSelector(selectSelectedLanguage);
	const dispatch = useAppDispatch();
	const [expand, setExpand] = useState(false);
	const mapsById = useSelector((state: State) => state.maps.byMapID);

	const maps = values(mapsById).map(map => (
		{ value: map.id, label: map.name, isDisabled: !(map.origin && map.opposite) } as SelectOption
	));
	const sortedMaps = maps.sort((mapA, mapB) => mapA.label.toLowerCase().
		localeCompare(mapB.label.toLowerCase(), String(locale), { sensitivity: 'accent' }));

	return (
		<>
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
							.sort()
							// map to components
							.map(chartType =>
								<DropdownItem
									key={chartType}
									onClick={() => {
										dispatch(graphSlice.actions.changeChartToRender(chartType));
										if (chartType === ChartTypes.map && Object.keys(sortedMaps).length === 1) {
											// If there is only one map, selectedMap is the id of the only map. ie; display map automatically if only 1 map
											dispatch({ type: 'UPDATE_SELECTED_MAPS', mapID: sortedMaps[0].value });

										}
									}}
								>
									{translate(`${chartType}`)}
								</DropdownItem>
							)
					}
				</DropdownMenu>
			</Dropdown >
		</ >
	);
}
const labelStyle: React.CSSProperties = {
	fontWeight: 'bold',
	margin: 0
};