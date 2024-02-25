/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { clearGraphHistory } from '../redux/actions/extraActions';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectAnythingFetching } from '../redux/selectors/apiSelectors';
import { changeSliderRange, selectIsDirty, selectSliderRangeInterval, updateTimeInterval } from '../redux/slices/graphSlice';
import HistoryComponent from './HistoryComponent';
import { TimeInterval } from '../../../common/TimeInterval';
/**
 * @returns Renders a history component with previous and next buttons.
 */
export default function PlotNavComponent() {
	return (
		<div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
			<HistoryComponent />
			<PlotNav />
		</div >
	);
}
export const PlotNav = () => {
	return (
		<div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
			<ExpandComponent />
			<TrashCanHistoryComponent />
			<RefreshGraphComponent />
		</div>
	);
};
export const TrashCanHistoryComponent = () => {
	const dispatch = useAppDispatch();
	const isDirty = useAppSelector(selectIsDirty);
	return (
		< img src={isDirty ? './full_trashcan.png' : './empty_trashcan.png'} style={{ height: '25px' }}
			onClick={() => {
				dispatch(clearGraphHistory());
			}}
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
	const slider = useAppSelector(selectSliderRangeInterval);
	const somethingFetching = useAppSelector(selectAnythingFetching);

	React.useEffect(() => {
		const interval = setInterval(() => { setTime(prevTime => (prevTime + 25) % 360); }, 16);
		if (!somethingFetching) {
			clearInterval(interval);
		}
		return () => clearInterval(interval);
	}, [somethingFetching]);
	return (
		<img src='./refresh.png' style={{ height: '25px', transform: `rotate(${time}deg)` }}
			onClick={() => { dispatch(updateTimeInterval(slider)); }}
		/>
	);
};