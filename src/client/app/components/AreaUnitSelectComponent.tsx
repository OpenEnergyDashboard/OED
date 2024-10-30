/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Select from 'react-select';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { graphSlice, selectGraphState } from '../redux/slices/graphSlice';
import { selectUnitDataById } from '../redux/api/unitsApi';
import { StringSelectOption } from '../types/items';
import { UnitRepresentType } from '../types/redux/units';
import { AreaUnitType } from '../utils/getAreaUnitConversion';
import { useTranslate } from '../redux/componentHooks';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * React Component that creates the area unit selector dropdown
 * @returns Area unit select element
 */
export default function AreaUnitSelectComponent() {
	const translate = useTranslate();
	const dispatch = useAppDispatch();
	const graphState = useAppSelector(selectGraphState);
	const unitDataById = useAppSelector(selectUnitDataById);

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
		dispatch(graphSlice.actions.toggleAreaNormalization());
	};

	const labelStyle: React.CSSProperties = {
		fontWeight: 'bold',
		margin: 0
	};
	const bottomSpace: React.CSSProperties = {
		paddingBottom: '10px'
	};

	if (graphState.selectedUnit != -99 && unitDataById[graphState.selectedUnit]?.unitRepresent === UnitRepresentType.raw) {
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
			{/* Will only show up if areaNormalization is enabled.
				The bottom padding makes sure the drop down area unit menu does not
				go below the next item so it can be visible/clicked through menu. */}
			{graphState.areaNormalization &&
				<div style={bottomSpace}>
					<p style={labelStyle}>
						<FormattedMessage id='area.unit' />:
					</p>
					<Select
						options={unitOptions}
						value={{ label: translate(`AreaUnitType.${graphState.selectedAreaUnit}`), value: graphState.selectedAreaUnit } as StringSelectOption}
						onChange={newSelectedUnit => {
							if (newSelectedUnit) {
								dispatch(graphSlice.actions.updateSelectedAreaUnit(newSelectedUnit.value as AreaUnitType));
							}
						}}
					/>
				</div>
			}
		</div>
	);
}
