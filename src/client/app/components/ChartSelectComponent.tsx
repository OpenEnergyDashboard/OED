/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import * as _ from 'lodash';
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
import { SelectOption } from '../types/items';
import { Dispatch } from '../types/redux/actions';
import { changeMeterOrGroupInfo } from '../actions/graph'

/**
 *  A component that allows users to select which chart should be displayed.
 * @returns Chart select element
 */
export default function ChartSelectComponent() {
	const divBottomPadding: React.CSSProperties = {
		paddingBottom: '15px'
	};
	const labelStyle: React.CSSProperties = {
		fontWeight: 'bold',
		margin: 0
	};

	const dispatch: Dispatch = useDispatch();
	const [expand, setExpand] = useState(false);
	const sortedMaps = _.sortBy(_.values(useSelector((state: State) => state.maps.byMapID)).map(map => (
		{ value: map.id, label: map.name, isDisabled: !(map.origin && map.opposite) } as SelectOption
	)), 'label');

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
						onClick={() => dispatch({ type: 'CHANGE_CHART_TO_RENDER', chartType: ChartTypes.line })}
					>
						<FormattedMessage id='line' />
					</DropdownItem>
					<DropdownItem
						onClick={() => dispatch({ type: 'CHANGE_CHART_TO_RENDER', chartType: ChartTypes.bar })}
					>
						<FormattedMessage id='bar' />
					</DropdownItem>
					<DropdownItem
						onClick={() => dispatch({ type: 'CHANGE_CHART_TO_RENDER', chartType: ChartTypes.compare })}
					>
						<FormattedMessage id='compare' />
					</DropdownItem>
					<DropdownItem
						onClick={() => {
							dispatch({ type: 'CHANGE_CHART_TO_RENDER', chartType: ChartTypes.map });
							if (Object.keys(sortedMaps).length === 1) {
								// If there is only one map, selectedMap is the id of the only map. ie; display map automatically if only 1 map
								dispatch({ type: 'UPDATE_SELECTED_MAPS', mapID: sortedMaps[0].value });
							}
						}}
					>
						<FormattedMessage id='map' />
					</DropdownItem>
					<DropdownItem
						onClick={() => {
							dispatch(changeMeterOrGroupInfo(null));
							dispatch({ type: 'CHANGE_CHART_TO_RENDER', chartType: ChartTypes.threeD });
						}
						}
					>
						<FormattedMessage id='3D' />
					</DropdownItem>
				</DropdownMenu>
			</Dropdown>
			<div>
				<TooltipMarkerComponent page='home' helpTextId='help.home.chart.select' />
			</div>
		</div>
	);
}
