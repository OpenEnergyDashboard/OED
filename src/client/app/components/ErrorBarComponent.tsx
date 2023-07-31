/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { State } from '../types/redux/state';
import { toggleShowMinMax } from '../actions/graph';
import translate from '../utils/translate';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * React Component rendering an Error Bar checkbox for toggle operation.
 * @returns Error Bar checkbox with tooltip and label
 */
const ErrorBarComponent = () => {
	const dispatch = useDispatch();
	const graphState = useSelector((state: State) => state.graph);

	/**
	 * Dispatches an action to toggle visibility of min/max lines on checkbox interaction
	 */
	const handleToggleShowMinMax = () => {
		dispatch(toggleShowMinMax());
	}

	return (
		<div className='checkbox'>
			<input
				type='checkbox'
				style={{ marginRight: '10px' }}
				onChange={() => handleToggleShowMinMax()}
				checked={graphState.showMinMax}
				id='errorBar'
			/>
			<label htmlFor='errorBar'>
				{translate('error.bar')}
			</label>
			<TooltipMarkerComponent page='home' helpTextId='help.home.error.bar' />
		</div>
	);
};

export default ErrorBarComponent;

