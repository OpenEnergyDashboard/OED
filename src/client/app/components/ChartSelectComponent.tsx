/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { graphSlice, selectChartToRender } from '../redux/slices/graphSlice';
import { ChartTypes } from '../types/redux/graph';
import { useTranslate } from '../redux/componentHooks';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import { labelStyle } from '../styles/modalStyle';

/**
 *  A component that allows users to select which chart should be displayed.
 * @returns Chart select element
 */
export default function ChartSelectComponent() {
	const translate = useTranslate();
	const currentChartToRender = useAppSelector(selectChartToRender);
	const dispatch = useAppDispatch();
	const [expand, setExpand] = useState(false);

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
						// TODO these items should be sorted by the current language values
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
