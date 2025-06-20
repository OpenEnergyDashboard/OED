/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import * as moment from 'moment';
import { TimeInterval } from '../../../common/TimeInterval';
import { clearGraphHistory } from '../redux/actions/extraActions';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectAnythingFetching } from '../redux/selectors/apiSelectors';
import {
	changeSliderRange, selectChartToRender, selectHistoryIsDirty,
	selectSelectedGroups, selectSelectedMeters,
	selectSliderRangeInterval, selectInitialXAxisRange,
	selectQueryTimeInterval, updateTimeIntervalAndSliderRange
} from '../redux/slices/graphSlice';
import HistoryComponent from './HistoryComponent';
import { ChartTypes } from '../types/redux/graph';

/**
 * @returns Renders a history component with previous and next buttons.
 */
export default function PlotNavComponent() {
	return (
		<div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
			<HistoryComponent />
			<RefreshGraphComponent />
		</div >
	);
}
export const TrashCanHistoryComponent = () => {
	const dispatch = useAppDispatch();
	const isDirty = useAppSelector(selectHistoryIsDirty);
	return (
		< img src={isDirty ? './full_trashcan.png' : './empty_trashcan.png'} style={{ height: '25px', visibility: isDirty ? 'visible' : 'hidden' }}
			onClick={() => { dispatch(clearGraphHistory()); }}
		/>
	);
};

export const ExpandComponent = () => {
	const dispatch = useAppDispatch();
	return (
		<img src='./expand.png' style={{ height: '25px' }}
			onClick={() => { dispatch(changeSliderRange(TimeInterval.unbounded())); }}
		/>
	);
};

export const RefreshGraphComponent = () => {
	const [time, setTime] = React.useState(0);
	const dispatch = useAppDispatch();
	const sliderInterval = useAppSelector(selectSliderRangeInterval);
	const queryTimeInterval = useAppSelector(selectQueryTimeInterval);
	const initialXAxisRange = useAppSelector(selectInitialXAxisRange);
	const somethingFetching = useAppSelector(selectAnythingFetching);
	const selectedMeters = useAppSelector(selectSelectedMeters);
	const selectedGroups = useAppSelector(selectSelectedGroups);
	const chartType = useAppSelector(selectChartToRender);
	const iconVisible = chartType !== ChartTypes.threeD
		&& chartType !== ChartTypes.map
		&& chartType !== ChartTypes.compare
		&& chartType !== ChartTypes.radar
		&& (selectedMeters.length || selectedGroups.length);

	React.useEffect(() => {
		const interval = setInterval(() => { setTime(prevTime => (prevTime + 25) % 360); }, 16);
		if (!somethingFetching) {
			clearInterval(interval);
		}
		return () => clearInterval(interval);
	}, [somethingFetching]);
	/**
	 * Computes the next query TimeInterval based on the current slider position and previous query interval.
	 * - If the previous query interval was unbounded on a side and the slider is at or beyond the min/max x-axis,
	 *   that side remains unbounded.
	 * - Otherwise, the slider's value is used for the new interval.
	 * @param prevQuery - The previous query interval (may be bounded or unbounded).
	 * @param slider - The current slider interval selected by the user.
	 * @param xAxisMin - The minimum x value of the data (left bound).
	 * @param xAxisMax - The maximum x value of the data (right bound).
	 * @returns  The new query interval to use for the next data fetch.
	 */
	function getNextQueryTimeInterval(
		prevQuery: TimeInterval,
		slider: TimeInterval,
		xAxisMin: moment.Moment | undefined,
		xAxisMax: moment.Moment | undefined
	): TimeInterval {
		let start: moment.Moment | undefined = slider.getStartTimestamp();
		let end: moment.Moment | undefined = slider.getEndTimestamp();

		// If previous query was unbounded on the left and slider is at or before min, keep left unbounded
		if (!prevQuery.getStartTimestamp() && start && xAxisMin && (start.isSameOrBefore(xAxisMin))) {
			start = undefined;
		}
		// If previous query was unbounded on the right and slider is at or after max, keep right unbounded
		if (!prevQuery.getEndTimestamp() && end && xAxisMax && (end.isSameOrAfter(xAxisMax))) {
			end = undefined;
		}
		return new TimeInterval(start, end);
	}
	return (
		<img
			src='./refresh.png'
			style={{ height: '25px', transform: `rotate(${time}deg)`, visibility: iconVisible ? 'visible' : 'hidden' }}
			onClick={() => {
				if (!somethingFetching) {
					const minX = initialXAxisRange?.getStartTimestamp?.();
					const maxX = initialXAxisRange?.getEndTimestamp?.();
					const nextInterval = getNextQueryTimeInterval(queryTimeInterval, sliderInterval, minX, maxX);
					dispatch(updateTimeIntervalAndSliderRange(nextInterval));
				}
			}}
		/>
	);
};
