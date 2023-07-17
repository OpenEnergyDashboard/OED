import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { useIntl, defineMessages } from 'react-intl';
import DateRangePicker from '@wojtekmaj/react-daterange-picker';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import 'react-calendar/dist/Calendar.css';
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css';
import { CloseReason, Value } from '@wojtekmaj/react-daterange-picker/dist/cjs/shared/types';
import { State } from '../types/redux/state';
import { ChartTypes } from '../types/redux/graph';
import { Dispatch } from '../types/redux/actions';
import { changeGraphZoomIfNeeded, updateThreeDTimeInterval } from '../actions/graph';
import { dateRangeToTimeInterval } from '../utils/dateRangeCompatability';
/**
 * A component which allows users to select date ranges for the graphic
 * @returns Chart data select element
 */
export default function ThreeDDateRangeComponent() {
	const intl = useIntl();
	const messages = defineMessages({ selectDateRange: { id: 'select.dateRange' }, redraw: { id: 'redraw' } });
	const dispatch: Dispatch = useDispatch();
	const threeDTimeInterval = useSelector((state: State) => state.graph.threeDTimeInterval);
	const chartToRender = useSelector((state: State) => state.graph.chartToRender);
	const onDatePickerChange = (value: Value) => dispatch(updateThreeDTimeInterval(value));
	const labelStyle: React.CSSProperties = { fontWeight: 'bold', margin: 0 };
	const onCalClose = () => { dispatch(changeGraphZoomIfNeeded(dateRangeToTimeInterval(threeDTimeInterval))) };
	// Don't Close Calendar when selecting dates.
	// This allows the value to update before calling the onCalClose() method to fetch data if needed.
	const shouldCloseCal = (props: { reason: CloseReason; }) => { return props.reason === 'select' ? false : true; };

	// Only Render if a 3D Graphic Type Selected.
	if (chartToRender === ChartTypes.threeD)
		return (
			<div style={{ width: '100%' }}>
				<p style={labelStyle}>{intl.formatMessage(messages.selectDateRange)}:</p>
				<DateRangePicker
					onChange={onDatePickerChange}
					onCalendarClose={onCalClose}
					shouldCloseCalendar={shouldCloseCal}
					value={threeDTimeInterval}
					minDate={new Date(1970, 0, 1)}
					maxDate={new Date()}
					defaultView={'year'}
				/>
				<TooltipMarkerComponent page='home' helpTextId='help.home.select.dateRange' />
			</div>);
	else
		return null;
}

