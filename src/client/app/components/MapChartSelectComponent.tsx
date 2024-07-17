/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { sortBy, values } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { State } from '../types/redux/state';
import { SelectOption } from '../types/items';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import SingleSelectComponent from './SingleSelectComponent';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * Component used to select the desired map
 * @returns Map Chart element
 */
export default function MapChartSelectComponent() {
	const divBottomPadding: React.CSSProperties = {
		paddingBottom: '15px'
	};
	const labelStyle: React.CSSProperties = {
		fontWeight: 'bold',
		margin: 0
	};
	const messages = defineMessages({
		selectMap: {id: 'select.map'}
	});

	// TODO When this is converted to RTK then should use useAppDispatch().
	//Utilizes useDispatch and useSelector hooks
	const dispatch = useDispatch();
	const sortedMaps = sortBy(values(useSelector((state: State) => state.maps.byMapID)).map(map => (
		{ value: map.id, label: map.name, isDisabled: !(map.origin && map.opposite) } as SelectOption
	)), 'label');

	const selectedMap = {
		label: useSelector((state: State) => state.maps.byMapID[state.maps.selectedMap] ? state.maps.byMapID[state.maps.selectedMap].name : ''),
		value: useSelector((state: State) => state.maps.selectedMap)
	};

	//useIntl instead of injectIntl and WrappedComponentProps
	const intl = useIntl();

	return (
		<div>
			<p style={labelStyle}>
				<FormattedMessage id='maps' />:
			</p>
			<div style={divBottomPadding}>
				<SingleSelectComponent
					options={sortedMaps}
					selectedOption={(selectedMap.value === 0) ? undefined : selectedMap}
					placeholder={intl.formatMessage(messages.selectMap)}
					onValueChange={selected => dispatch({type: 'UPDATE_SELECTED_MAPS', mapID: selected.value})}
					//When we specify stuff in actions files, we also specify other variables, in this case mapID.
					//This is where we specify values instead of triggering the action by itself.
				/>
				<TooltipMarkerComponent page='home' helpTextId='help.home.select.maps'/>
			</div>
		</div>
	);
}
