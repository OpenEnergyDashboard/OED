/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import DateRangePicker from '@wojtekmaj/react-daterange-picker';
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css';
import { Value } from '@wojtekmaj/react-daterange-picker/dist/cjs/shared/types';
import * as React from 'react';
import 'react-calendar/dist/Calendar.css';
import { useDispatch } from 'react-redux';
import { graphSlice } from '../reducers/graph';
import { useAppSelector } from '../redux/hooks';
import { Dispatch } from '../types/redux/actions';
import { dateRangeToTimeInterval, timeIntervalToDateRange } from '../utils/dateRangeCompatibility';
import translate from '../utils/translate';
import TooltipMarkerComponent from './TooltipMarkerComponent';
/**
 * A component which allows users to select date ranges in lieu of a slider (line graphic)
 * @returns Date Range Calendar Picker
 */
export default function DateRangeComponent() {
	const { selectWorkingTimeInterval: graphWorkingTimeInterval, selectQueryTimeInterval } = graphSlice.selectors
	const dispatch: Dispatch = useDispatch();
	const timeInterval = useAppSelector(selectQueryTimeInterval);
	const workingTimeInterval = useAppSelector(graphWorkingTimeInterval);
	const locale = useAppSelector(state => state.options.selectedLanguage);

	const handleChange = (value: Value) => {
		console.log(value)

		if (!value) {
			// Value has been cleared
			dispatch(graphSlice.actions.resetTimeInterval())
		} else {
			dispatch(graphSlice.actions.updateTimeInterval(dateRangeToTimeInterval(value)))

		}
	}

	return (
		<div style={{ width: '100%' }}>
			<p style={labelStyle}>
				{translate('date.range')}:
				<TooltipMarkerComponent page='home' helpTextId={translate('select.dateRange')} />
			</p>
			<DateRangePicker
				value={timeIntervalToDateRange(workingTimeInterval)}
				onChange={handleChange}
				defaultView={'year'}
				minDate={new Date(1970, 0, 1)}
				maxDate={new Date()}
				locale={locale} // Formats Dates, and Calendar months base on locale
				disabled={!timeInterval.getIsBounded()}
				calendarIcon={null} // TODO Verify Behavior
			/>
		</div>
	);
}

const labelStyle: React.CSSProperties = { fontWeight: 'bold', margin: 0 };
