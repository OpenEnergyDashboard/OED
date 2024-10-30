/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Input } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { graphSlice, selectSortingOrder } from '../redux/slices/graphSlice';
import { SortingOrder } from '../utils/calculateCompare';
import { useTranslate } from '../redux/componentHooks';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import IntervalControlsComponent from './IntervalControlsComponent';

/**
 * @returns controls for compare page.
 */
export default function CompareControlsComponent() {
	const translate = useTranslate();
	const dispatch = useAppDispatch();

	// This is the current sorting order for graphic
	const compareSortingOrder = useAppSelector(selectSortingOrder);

	// Updates sorting order when the sort order menu is used.
	const handleSortingChange = (value: string) => {
		const sortingOrder = value as unknown as SortingOrder;
		dispatch(graphSlice.actions.changeCompareSortingOrder(sortingOrder));
	};

	return (
		<div>
			{<IntervalControlsComponent key='interval' />}
			<div style={divTopBottomPadding}>
				<p style={labelStyle}>
					{translate('sort')}:
					<TooltipMarkerComponent page='home' helpTextId='help.home.compare.sort.tip' />
				</p>
				<Input
					type="select"
					value={compareSortingOrder?.toString()}
					onChange={e => handleSortingChange(e.target.value)}
				>
					<option value={SortingOrder.Alphabetical.toString()}>{translate('alphabetically')}</option>
					<option value={SortingOrder.Ascending.toString()}>{translate('ascending')}</option>
					<option value={SortingOrder.Descending.toString()}>{translate('descending')}</option>
				</Input>
			</div>
		</div >
	);
}

const divTopBottomPadding: React.CSSProperties = {
	paddingTop: '0px',
	paddingBottom: '15px'
};

const labelStyle: React.CSSProperties = {
	fontWeight: 'bold',
	margin: 0
};
