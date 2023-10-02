/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import DateRangePicker from '@wojtekmaj/react-daterange-picker';
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css';
import { CloseReason, Value } from '@wojtekmaj/react-daterange-picker/dist/cjs/shared/types';
import * as React from 'react';
import { useEffect, useState } from 'react';
import 'react-calendar/dist/Calendar.css';
import { useDispatch, useSelector } from 'react-redux';
import { graphSlice } from '../reducers/graph';
import { Dispatch } from '../types/redux/actions';
import { ChartTypes } from '../types/redux/graph';
import { State } from '../types/redux/state';
import { dateRangeToTimeInterval, timeIntervalToDateRange } from '../utils/dateRangeCompatibility';
import translate from '../utils/translate';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * A component which allows users to select date ranges in lieu of a slider (line graphic)
 * @returns Date Range Calendar Picker
 */
export default function DateRangeComponent() {
	const timeInterval = useSelector((state: State) => state.graph.timeInterval);
	const locale = useSelector((state: State) => state.options.selectedLanguage);
	const chartToRender = useSelector((state: State) => state.graph.chartToRender);
	const dispatch: Dispatch = useDispatch();

	const [dateRange, setDateRange] = useState<Value>([null, null]);
	// Keep this component in sync with global time interval
	useEffect(() => setDateRange(timeIntervalToDateRange(timeInterval)), [timeInterval]);

	// Don't Close Calendar when selecting dates.
	// This allows the value to update before calling the onCalClose() method to fetch data if needed.
	const shouldCloseCalendar = (props: { reason: CloseReason }) => { return props.reason === 'select' ? false : true; };
	const onCalClose = () => { dispatch(graphSlice.actions.changeGraphZoom(dateRangeToTimeInterval(dateRange))) };

	// Only Render if a 3D Graphic Type Selected.
	if (chartToRender === ChartTypes.threeD)
		return (
			<div style={{ width: '100%' }}>
				<p style={labelStyle}>
					{translate('date.range')}:
					<TooltipMarkerComponent page='home' helpTextId={translate('select.dateRange')} />
				</p>
				<DateRangePicker
					value={dateRange}
					onChange={setDateRange}
					shouldCloseCalendar={shouldCloseCalendar}
					onCalendarClose={onCalClose}
					defaultView={'year'}
					clearIcon={null} // clear not necessary for 3D interval must be bounded
					calendarIcon={null} // unnecessary
					minDate={new Date(1970, 0, 1)}
					maxDate={new Date()}
					locale={locale} // Formats Dates, and Calendar months base on locale
				/>
			</div>);
	else
		return null;
}


const labelStyle: React.CSSProperties = { fontWeight: 'bold', margin: 0 };