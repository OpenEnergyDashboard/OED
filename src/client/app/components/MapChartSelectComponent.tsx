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
import { selectSelectedLanguage } from '../redux/slices/appStateSlice';
import { labelStyle } from '../styles/modalStyle';

/**
 * Component used to select the desired map
 * @returns Map Chart element
 */
export default function MapChartSelectComponent() {
	const divBottomPadding: React.CSSProperties = {
		paddingBottom: '15px'
	};

	const messages = defineMessages({
		selectMap: { id: 'select.map' }
	});

	// TODO When this is converted to RTK then should use useAppDispatch().
	//Utilizes useDispatch and useSelector hooks
	const dispatch = useAppDispatch();

	const sortedMaps = useAppSelector(selectMapSelectOptions);
	// TODO This is not optimal and probably should be revisited per the following comments.
	// See src/client/app/redux/entityAdapters.ts for why it does not honor the user selected language.
	// This sorts within the component based on the user selected language.
	// The selectMapSelectOptions is already sorting so that could be stopped but is not in case
	// a better solution is found.
	// It would be nice to detect if the language used by selectMapSelectOptions is not the user selected
	// one so it would only sort if needed.
	// This is used for now since fast (very few maps) and easy.
	const locale = useAppSelector(selectSelectedLanguage);
	sortedMaps.sort((mapA, mapB) => mapA.label.toLowerCase().
		localeCompare(mapB.label.toLowerCase(), String(locale), { sensitivity: 'accent' }));

	const selectedMapData = useAppSelector(state => selectMapById(state, selectSelectedMap(state)));

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
					selectedOption={selectedMapData ? { label: selectedMapData.name, value: selectedMapData.id } : undefined}
					placeholder={intl.formatMessage(messages.selectMap)}
					onValueChange={selected => dispatch(updateSelectedMaps(selected.value))}
				/>
			</div>
		</div>
	);
}
