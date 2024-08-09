/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Input } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectChartToRender, graphSlice, selectSortingOrder } from '../redux/slices/graphSlice';
import { ChartTypes } from '../types/redux/graph';
import { SortingOrder } from '../utils/calculateCompare';
import translate from '../utils/translate';
import TooltipMarkerComponent from './TooltipMarkerComponent'
import IntervalControlsComponent from './IntervalControlsComponent';

/**
 * @returns controls for bar page.
 */
export default function CompareControlsComponent() {
    const dispatch = useAppDispatch();

    const chartType = useAppSelector(selectChartToRender);

    // This is the current sorting order for graphic
	const compareSortingOrder = chartType === ChartTypes.compare ? useAppSelector(selectSortingOrder) : undefined;

    // Updates sorting order when the sort order menu is used.
	const handleSortingChange = (value: string) => {
		if (chartType === ChartTypes.compare) {
			const sortingOrder = value as unknown as SortingOrder;
			dispatch(graphSlice.actions.changeCompareSortingOrder(sortingOrder));
		}
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
