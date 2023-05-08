/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import Select from 'react-select';
import { toggleAreaNormalization, updateSelectedAreaUnit } from '../actions/graph';
import { StringSelectOption } from '../types/items';
import { State } from '../types/redux/state';
import { AreaUnitType } from '../utils/getAreaUnitConversion';
import translate from '../utils/translate';
import { UnitRepresentType } from '../types/redux/units';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * React Component that creates the area unit selector dropdown
 * @returns {Element} JSX Element
 */
export default function AreaUnitSelectComponent() {
	const dispatch = useDispatch();

	const graphState = useSelector((state: State) => state.graph);
	const unitState = useSelector((state: State) => state.units.units);

	// Array of select options created from the area unit enum
	const unitOptions: StringSelectOption[] = [];

	Object.keys(AreaUnitType).forEach(unitKey => {
		// don't allow normalization by no unit
		if (unitKey != AreaUnitType.none) {
			unitOptions.push({
				label: translate(`AreaUnitType.${unitKey}`),
				value: unitKey
			} as StringSelectOption);
		}
	});

	const handleToggleAreaNormalization = () => {
		dispatch(toggleAreaNormalization());
	}

	const labelStyle: React.CSSProperties = {
		fontWeight: 'bold',
		margin: 0
	};

	if (graphState.selectedUnit != -99 && unitState[graphState.selectedUnit].unitRepresent === UnitRepresentType.raw) {
		return null;
	}

	return (
		<div>
			<div className='checkbox'>
				<input
					type='checkbox'
					style={{ marginRight: '10px' }}
					onChange={handleToggleAreaNormalization}
					checked={graphState.areaNormalization}
					id='areaNormalization'
				/>
				<label htmlFor='areaNormalization'>
					<FormattedMessage id='area.normalize' />
				</label>
				<TooltipMarkerComponent page='home' helpTextId='help.home.area.normalize' />
			</div>
			{/* Will only show up if areaNormalization is enabled */}
			{graphState.areaNormalization &&
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
				</div>
			}
		</div>
	);
}