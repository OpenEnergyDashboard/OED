/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';

import { ChartTypes } from '../types/redux/graph';
import { FormattedMessage } from 'react-intl';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import Dropdown from 'reactstrap/lib/Dropdown';
import DropdownItem from 'reactstrap/lib/DropdownItem';
import DropdownToggle from 'reactstrap/lib/DropdownToggle';
import DropdownMenu from 'reactstrap/lib/DropdownMenu';
import { useDispatch, useSelector } from 'react-redux';
import { State } from '../types/redux/state';
import { useState } from 'react';

/**
 *  A component that allows users to select which chart should be displayed.
 */
export default function ChartSelectComponent() {
	const divBottomPadding: React.CSSProperties = {
		paddingBottom: '15px'
	};
	const labelStyle: React.CSSProperties = {
		fontWeight: 'bold',
		margin: 0
	};

	const dispatch = useDispatch();
	const [expand, setExpand] = useState(false);
	return (
		<div style={divBottomPadding}>
			<p style={labelStyle}>
				<FormattedMessage id='graph.type' />:
			</p>
			<Dropdown isOpen={expand} toggle={() => setExpand(!expand)}>
				<DropdownToggle outline caret>
					<FormattedMessage id={useSelector((state: State) => state.graph.chartToRender)} />
				</DropdownToggle>
				<DropdownMenu>
					<DropdownItem
						onClick={() => dispatch({type: 'CHANGE_CHART_TO_RENDER', chartType: ChartTypes.line})}
					>
						<FormattedMessage id='line' />
					</DropdownItem>
					<DropdownItem
						onClick={() => dispatch({type: 'CHANGE_CHART_TO_RENDER', chartType: ChartTypes.bar})}
					>
						<FormattedMessage id='bar' />
					</DropdownItem>
					<DropdownItem
						onClick={() => dispatch({type: 'CHANGE_CHART_TO_RENDER', chartType: ChartTypes.compare})}
					>
						<FormattedMessage id='compare' />
					</DropdownItem>
					<DropdownItem
						onClick={() => dispatch({type: 'CHANGE_CHART_TO_RENDER', chartType: ChartTypes.map})}
					>
						<FormattedMessage id='map' />
					</DropdownItem>
				</DropdownMenu>
			</Dropdown>
			<div>
				<TooltipMarkerComponent page='home' helpTextId='help.home.chart.select' />
			</div>
		</div>
	);
}
