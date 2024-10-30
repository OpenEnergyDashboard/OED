/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { graphSlice, selectBarStacking } from '../redux/slices/graphSlice';
import { useTranslate } from '../redux/componentHooks';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import IntervalControlsComponent from './IntervalControlsComponent';

/**
 * @returns controls for bar page.
 */
export default function BarControlsComponent() {
	const translate = useTranslate();
	const dispatch = useAppDispatch();

	const barStacking = useAppSelector(selectBarStacking);

	const handleChangeBarStacking = () => {
		dispatch(graphSlice.actions.changeBarStacking());
	};

	return (
		<div>
			<div className='checkbox' style={divTopBottomPadding}>
				<input type='checkbox' style={{ marginRight: '10px' }} onChange={handleChangeBarStacking} checked={barStacking} id='barStacking' />
				<label htmlFor='barStacking'>{translate('bar.stacking')}</label>
				<TooltipMarkerComponent page='home' helpTextId='help.home.bar.stacking.tip' />
			</div>
			{<IntervalControlsComponent key='interval' />}
		</div >
	);
}

const divTopBottomPadding: React.CSSProperties = {
	paddingTop: '0px',
	paddingBottom: '15px'
};
