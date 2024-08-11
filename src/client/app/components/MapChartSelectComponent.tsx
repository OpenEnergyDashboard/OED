/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { selectMapById, selectMapSelectOptions } from '../redux/api/mapsApi';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectSelectedMap, updateSelectedMaps } from '../redux/slices/graphSlice';
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
		selectMap: { id: 'select.map' }
	});

	// TODO When this is converted to RTK then should use useAppDispatch().
	//Utilizes useDispatch and useSelector hooks
	const dispatch = useAppDispatch();

	const sortedMaps = useAppSelector(selectMapSelectOptions);
	const selectedMapData = useAppSelector(state => selectMapById(state, selectSelectedMap(state)));


	const selectedMap = {
		label: selectedMapData.name,
		value: selectedMapData.id
	};

	//useIntl instead of injectIntl and WrappedComponentProps
	const intl = useIntl();

	return (
		<div>
			<p style={labelStyle}>
				<FormattedMessage id='maps' />:
				<TooltipMarkerComponent page='home' helpTextId='help.home.select.maps' />
			</p>
			<div style={divBottomPadding}>
				<SingleSelectComponent
					options={sortedMaps}
					selectedOption={(selectedMap.value === 0) ? undefined : selectedMap}
					placeholder={intl.formatMessage(messages.selectMap)}
					onValueChange={selected => dispatch(updateSelectedMaps(selected.value))}
				/>
			</div>
		</div>
	);
}
