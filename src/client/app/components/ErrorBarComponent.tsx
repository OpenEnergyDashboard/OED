/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { graphSlice, selectShowMinMax } from '../redux/slices/graphSlice';
import { useTranslate } from '../redux/componentHooks';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * React Component rendering an Error Bar checkbox for toggle operation.
 * @returns Error Bar checkbox with tooltip and label
 */
export default function ErrorBarComponent() {
	const translate = useTranslate();
	const dispatch = useAppDispatch();
	const showMinMax = useAppSelector(selectShowMinMax);

	return (
		<div className='checkbox'>
			<input
				type='checkbox'
				style={{ marginRight: '10px' }}
				// Dispatches an action to toggle visibility of min/max lines on checkbox interaction
				onChange={() => dispatch(graphSlice.actions.toggleShowMinMax())}
				checked={showMinMax}
				id='errorBar'
			/>
			<label htmlFor='errorBar'>
				{translate('error.bar')}
			</label>
			<TooltipMarkerComponent page='home' helpTextId='help.home.error.bar' />
		</div>
	);
}
