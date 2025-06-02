import * as React from 'react';
import { Button } from 'reactstrap';
import { useAppDispatch } from '../redux/reduxHooks';
import { changeSliderRange, updateTimeInterval } from '../redux/slices/graphSlice';
import { TimeInterval } from '../../../common/TimeInterval';
import { useTranslate } from '../redux/componentHooks';


//TODO: Translate Internationalization
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
				console.log('Clear Date Range button clicked');
				dispatch(updateTimeInterval(TimeInterval.unbounded()));
				dispatch(changeSliderRange(TimeInterval.unbounded()));
			}}
		>
			{translate('clear.date.range')}
		</Button>
	);
}