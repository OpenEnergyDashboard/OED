import * as React from 'react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux'
import { useIntl, defineMessages } from 'react-intl';
import DateRangePicker from '@wojtekmaj/react-daterange-picker';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import 'react-calendar/dist/Calendar.css';
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css';
import { Value } from '@wojtekmaj/react-daterange-picker/dist/cjs/shared/types';
import { State } from '../types/redux/state';
// import { updateThreeDTimeInterval } from '../actions/graph'
import { TimeInterval } from '../../../common/TimeInterval';
import { ChartTypes } from '../types/redux/graph';
// import { fetchNeededThreeDReadings } from '../actions/threeDReadings';
// import { isEqual } from 'lodash';

/**
 * A component which allows users to select date ranges for the graphic
 * @returns Chart data select element
 */
export default function ThreeDDateRangeComponent() {
	const intl = useIntl();
	const messages = defineMessages({ selectDateRange: { id: 'select.dateRange' } });
	// const dispatch: Dispatch = useDispatch();

	const [dateRangeValue, dateRangeValueChange] = useState<Value>(null);
	const graphState = useSelector((state: State) => state.graph);

	// Updates DateRangePicker with time intervals selected by other meter pages
	useEffect(() => dateRangeValueChange(timeIntervalToDateRange(graphState.timeInterval)), [graphState.timeInterval]); // Re-run on interval update.

	const labelStyle: React.CSSProperties = { fontWeight: 'bold', margin: 0 };

	// Only Render if a 3D Graphic Type Selected.
	if (graphState.chartToRender === ChartTypes.threeD)
		return (
			<div>
				<p style={labelStyle}>{intl.formatMessage(messages.selectDateRange)}:</p>
				<DateRangePicker onChange={dateRangeValueChange} value={dateRangeValue} />
				<TooltipMarkerComponent page='home' helpTextId='help.home.select.dateRange' />
			</div>);
	else
		return null;
}
/**
 * Converts from OED's TimeInterval into a DateRange for compatibility with DateRangePicker
 * @param timeInterval - current redux state
 * @returns the a time interval into a dateRange compatible for a date-picker using Date().
 */
export function timeIntervalToDateRange(timeInterval: TimeInterval): Value {
	if (timeInterval.getIsBounded()) {
		const start = timeInterval.getStartTimestamp().toDate();
		const end = timeInterval.getEndTimestamp().toDate();
		return [start, end];
	}
	return null;
}

