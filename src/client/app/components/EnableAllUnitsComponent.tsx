/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useTranslate } from '../redux/componentHooks';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import {
	selectEnableAllUnits,
	setEnableAllUnits
} from '../redux/slices/appStateSlice';
import { checkboxStyle } from '../styles/modalStyle';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * Renders the checkbox that controls whether non-preferred units
 * are included in the graph unit dropdown.
 * @returns Enable all units checkbox.
 */
export default function EnableAllUnitsComponent() {
	const translate = useTranslate();
	const dispatch = useAppDispatch();
	const enableAllUnits = useAppSelector(selectEnableAllUnits);

	return (
		<div className='checkbox'>
			<input
				type='checkbox'
				style={checkboxStyle}
				onChange={event => dispatch(setEnableAllUnits(event.target.checked))}
				checked={enableAllUnits}
				id='enableAllUnits'
			/>
			<label htmlFor='enableAllUnits'>
				{translate('enable.all.units')}
			</label>
			<TooltipMarkerComponent
				page='home'
				helpTextId='help.home.enable.all.units'
			/>
		</div>
	);
}
