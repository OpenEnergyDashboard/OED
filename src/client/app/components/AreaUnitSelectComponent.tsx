/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import Select from 'react-select';
import { updateSelectedAreaUnit } from '../actions/graph';
import { StringSelectOption } from '../types/items';
import { State } from '../types/redux/state';
import { AreaUnitType } from '../utils/getAreaUnitConversion';
import translate from '../utils/translate';

/**
 * React Component that creates the area unit selector dropdown
 * @returns {Element} JSX Element
 */
export default function AreaUnitSelectComponent() {
	const dispatch = useDispatch();

	const graphState = useSelector((state: State) => state.graph);

	// Array of select options created from the rates
	const unitOptions: StringSelectOption[] = [];

	Object.keys(AreaUnitType).forEach(unitKey => {
		// don't allow normalization by no unit
		if(unitKey != AreaUnitType.none) {
			unitOptions.push({
				label: translate(`AreaUnitType.${unitKey}`),
				value: unitKey
			} as StringSelectOption);
		}
	});

	const labelStyle: React.CSSProperties = {
		fontWeight: 'bold',
		margin: 0
	};

	return (
		<div>
			{
				graphState.areaNormalization &&
				<div>
					<p style={labelStyle}>
						<FormattedMessage id='units.area' />:
					</p>
					<Select
						options={unitOptions}
						value={{ label: translate(`AreaUnitType.${graphState.selectedAreaUnit}`), value: graphState.selectedAreaUnit} as StringSelectOption}
						onChange={newSelectedUnit => {
							if (newSelectedUnit) {
								dispatch(updateSelectedAreaUnit(newSelectedUnit.value as AreaUnitType))
							}
						}}
					/>
					{/* <TooltipMarkerComponent page='home' helpTextId='help.home.select.units' /> */}
				</div>
			}
		</div>
	);
}