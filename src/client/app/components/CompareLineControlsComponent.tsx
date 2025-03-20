/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Input } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import {
	selectQueryTimeInterval, selectShiftAmount, selectShiftTimeInterval, updateShiftAmount, updateShiftTimeInterval
} from '../redux/slices/graphSlice';
import translate from '../utils/translate';
import { FormattedMessage } from 'react-intl';
import { ShiftAmount } from '../types/redux/graph';
import DateRangePicker from '@wojtekmaj/react-daterange-picker';
import { dateRangeToTimeInterval, timeIntervalToDateRange } from '../utils/dateRangeCompatibility';
import { selectSelectedLanguage } from '../redux/slices/appStateSlice';
import { Value } from '@wojtekmaj/react-daterange-picker/dist/cjs/shared/types';
import * as moment from 'moment';
import { TimeInterval } from '../../../common/TimeInterval';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * @returns compare line control component for compare line graph page
 */
export default function CompareLineControlsComponent() {
	const dispatch = useAppDispatch();
	const shiftAmount = useAppSelector(selectShiftAmount);
	const timeInterval = useAppSelector(selectQueryTimeInterval);
	const locale = useAppSelector(selectSelectedLanguage);
	const shiftInterval = useAppSelector(selectShiftTimeInterval);
	// Hold value to store the custom date range for the shift interval
	const [customDateRange, setCustomDateRange] = React.useState<TimeInterval>(shiftInterval);

	// Translation for shift amount
	const shiftAmountTranslations: Record<keyof typeof ShiftAmount, string> = {
		none: 'select.shift.amount',
		day: '1.day',
		week: '1.week',
		month: '1.month',
		year: '1.year',
		custom: 'custom.date.range'
	};

	// Update the shift interval when the shift option changes
	React.useEffect(() => {
		if (shiftAmount !== ShiftAmount.custom && timeInterval.getIsBounded()) {
			const { shiftedStart, shiftedEnd } = shiftDate(timeInterval.getStartTimestamp(), timeInterval.getEndTimestamp(), shiftAmount);
			const newInterval = new TimeInterval(shiftedStart, shiftedEnd);
			dispatch(updateShiftTimeInterval(newInterval));
			// set the custom date range to the new interval
			setCustomDateRange(newInterval);
		}
	}, [shiftAmount, timeInterval]);

	// Handle changes in shift option (week, month, year, or custom)
	const handleShiftOptionChange = (value: string) => {
		if (value === 'custom') {
			dispatch(updateShiftAmount(ShiftAmount.custom));
		} else {
			const newShiftOption = value as ShiftAmount;
			dispatch(updateShiftAmount(newShiftOption));
		}
	};

	// Update date when the data range picker is used in custome shifting option
	const handleCustomShiftDateChange = (value: Value) => {
		setCustomDateRange(dateRangeToTimeInterval(value));
		dispatch(updateShiftTimeInterval(dateRangeToTimeInterval(value)));
	};

	return (
		<>
			<div key='side-options'>
				<p style={{ fontWeight: 'bold', margin: 0 }}>
					<FormattedMessage id='shift.date.interval' />
					<TooltipMarkerComponent page={'home'} helpTextId='help.shift.date.interval' />
				</p>
				<Input
					id='shiftDateInput'
					name='shiftDateInput'
					type='select'
					value={shiftAmount}
					invalid={shiftAmount === ShiftAmount.none}
					onChange={e => handleShiftOptionChange(e.target.value)}
				>
					{Object.entries(ShiftAmount).map(
						([key, value]) => (
							<option
								hidden={value === 'none'}
								disabled={value === 'none'}
								value={value}
								key={key}
							>
								{translate(shiftAmountTranslations[key as keyof typeof ShiftAmount])}
							</option>
						)
					)}
				</Input>
				{/* Show date picker when custom date range is selected */}
				{shiftAmount === ShiftAmount.custom &&
					<DateRangePicker
						value={timeIntervalToDateRange(customDateRange)}
						onChange={handleCustomShiftDateChange}
						minDate={new Date(1970, 0, 1)}
						maxDate={new Date()}
						locale={locale} // Formats Dates, and Calendar months base on locale
						calendarIcon={null}
						calendarProps={{ defaultView: 'year' }}
					/>}
			</div>
		</>
	);

}

/**
 * Shifting date function to find the shifted start date and shifted end date for shift amount that is not custom
 * @param originalStart  start date of current graph data
 * @param originalEnd end date of current graph data
 * @param shiftType shifting amount in week, month, or year
 * @returns shifted start and shifted end dates for the new data
 */
export function shiftDate(originalStart: moment.Moment, originalEnd: moment.Moment, shiftType: ShiftAmount) {
	let shiftedStart = originalStart.clone();

	if (shiftType === ShiftAmount.day) {
		shiftedStart = originalStart.clone().subtract(1, 'days');
	} else if (shiftType === ShiftAmount.week) {
		shiftedStart = originalStart.clone().subtract(7, 'days');
	} else if (shiftType === ShiftAmount.month) {
		shiftedStart = originalStart.clone().subtract(1, 'months');
	} else if (shiftType === ShiftAmount.year) {
		shiftedStart = originalStart.clone().subtract(1, 'years');
	}

	// Add the number of days in the original line to the shifted start to get the end.
	// This means the original and shifted lines have the same number of days.
	// Let moment decide the day since it may help with leap years, etc.
	const originalDateRange = originalEnd.diff(originalStart, 'days');
	const shiftedEnd = shiftedStart.clone().add(originalDateRange, 'days');

	return { shiftedStart, shiftedEnd };
}