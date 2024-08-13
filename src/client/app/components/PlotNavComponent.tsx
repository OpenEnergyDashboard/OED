/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { TimeInterval } from '../../../common/TimeInterval';
import { clearGraphHistory } from '../redux/slices/graphSlice';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectAnythingFetching } from '../redux/selectors/apiSelectors';
import {
	changeSliderRange, selectChartToRender, selectHistoryIsDirty,
	selectSelectedGroups, selectSelectedMeters,
	selectSliderRangeInterval, updateTimeInterval
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
	return (
		<img
			src='./refresh.png'
			style={{ height: '25px', transform: `rotate(${time}deg)`, visibility: iconVisible ? 'visible' : 'hidden' }}
			onClick={() => { !somethingFetching && dispatch(updateTimeInterval(sliderInterval)); }}
		/>
	);
};
