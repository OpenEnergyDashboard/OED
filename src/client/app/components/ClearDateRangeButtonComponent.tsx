/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button } from 'reactstrap';
import { useAppDispatch } from '../redux/reduxHooks';
import { changeSliderRange, updateTimeInterval } from '../redux/slices/graphSlice';
import { TimeInterval } from '../../../common/TimeInterval';
import { useTranslate } from '../redux/componentHooks';

/**
 * A button component that, when clicked, clears the current date range filter
 * by dispatching an action to set the query TimeInterval to unbounded (no start or end).
 * @returns The rendered "Clear Date Range" button.
 */
export default function ClearDateRangeButton() {
	const dispatch = useAppDispatch();
	const translate = useTranslate();
	return (
		<Button
			color="secondary"
			onClick={() => {
				dispatch(updateTimeInterval(TimeInterval.unbounded()));
				dispatch(changeSliderRange(TimeInterval.unbounded()));
			}}
		>
			{translate('clear.date.range')}
		</Button>
	);
}