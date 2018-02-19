/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { fetchMetersDetailsIfNeeded } from './meters';
import { fetchGroupsDetailsIfNeeded } from './groups';
import { fetchNeededLineReadings } from './lineReadings';
import { fetchNeededBarReadings, fetchNeededCompareReadings } from './barReadings';
import { TimeInterval } from '../../../common/TimeInterval';
import { Dispatch, Thunk, ActionType } from '../types/redux/actions';
import { State } from '../types/redux/state';
import * as t from '../types/redux/graph';
import { Duration } from 'moment';

export function changeChartToRender(chartType: t.ChartTypes): t.ChangeChartToRenderAction {
	return { type: ActionType.ChangeChartToRender, chartType };
}

export function changeBarStacking(): t.ChangeBarStackingAction {
	return { type: ActionType.ChangeBarStacking };
}

export function updateSelectedMeters(meterIDs: number[]): t.UpdateSelectedMetersAction {
	return { type: ActionType.UpdateSelectedMeters, meterIDs };
}

export function updateSelectedGroups(groupIDs: number[]): t.UpdateSelectedGroupsAction {
	return { type: ActionType.UpdateSelectedGroups, groupIDs };
}

export function updateBarDuration(barDuration: moment.Duration): t.UpdateBarDurationAction {
	return { type: ActionType.UpdateBarDuration, barDuration };
}

function changeGraphZoom(timeInterval: TimeInterval): t.ChangeGraphZoomAction {
	return { type: ActionType.ChangeGraphZoom, timeInterval };
}

export function changeBarDuration(barDuration: moment.Duration): Thunk {
	return (dispatch, getState) => {
		dispatch(updateBarDuration(barDuration));
		dispatch(fetchNeededBarReadings(getState().graph.timeInterval));
		return Promise.resolve();
	};
}

function updateCompareTimeInterval(compareTimeInterval: TimeInterval): t.UpdateCompareIntervalAction {
	return { type: ActionType.UpdateCompareInterval, compareTimeInterval };
}

function updateCompareDuration(compareDuration: Duration): t.UpdateCompareDurationAction {
	return { type: ActionType.UpdateCompareDuration, compareDuration };
}

export function changeCompareTimeInterval(compareTimeInterval: TimeInterval, compareDuration: Duration): Thunk {
	return (dispatch, getState) => {
		dispatch(updateCompareTimeInterval(compareTimeInterval));
		dispatch(updateCompareDuration(compareDuration));
		dispatch(fetchNeededCompareReadings(getState().graph.compareTimeInterval));
		return Promise.resolve();
	};
}

export function changeSelectedMeters(meterIDs: number[]): Thunk {
	return (dispatch, getState) => {
		dispatch(updateSelectedMeters(meterIDs));
		// Nesting dispatches to preserve that updateSelectedMeters() is called before fetching readings
		dispatch(dispatch2 => {
			dispatch2(fetchNeededLineReadings(getState().graph.timeInterval));
			dispatch2(fetchNeededBarReadings(getState().graph.timeInterval));
			dispatch2(fetchNeededCompareReadings(getState().graph.compareTimeInterval));
		});
		return Promise.resolve();
	};
}

export function changeSelectedGroups(groupIDs: number[]): Thunk {
	return (dispatch, getState) => {
		dispatch(updateSelectedGroups(groupIDs));
		// Nesting dispatches to preserve that updateSelectedGroups() is called before fetching readings
		dispatch(dispatch2 => {
			dispatch2(fetchNeededLineReadings(getState().graph.timeInterval));
			dispatch2(fetchNeededBarReadings(getState().graph.timeInterval));
			// TODO TYPESCRIPT??
			dispatch2(fetchNeededCompareReadings(getState().graph.compareTimeInterval));
		});
		return Promise.resolve();
	};
}

function fetchNeededReadingsForGraph(timeInterval: TimeInterval): Thunk {
	return dispatch => {
		dispatch(fetchNeededLineReadings(timeInterval));
		dispatch(fetchNeededBarReadings(timeInterval));
		return Promise.resolve();
	};
}

function shouldChangeGraphZoom(state: State, timeInterval: TimeInterval): boolean {
	return !state.graph.timeInterval.equals(timeInterval);
}

export function changeGraphZoomIfNeeded(timeInterval: TimeInterval): Thunk {
	return (dispatch, getState) => {
		if (shouldChangeGraphZoom(getState(), TimeInterval.unbounded())) {
			dispatch(changeGraphZoom(timeInterval));
			dispatch(fetchNeededReadingsForGraph(timeInterval));
		}
		return Promise.resolve();
	};
}

export interface LinkOptions {
	meterIDs?: number[];
	groupIDs?: number[];
	chartType?: t.ChartTypes;
	barDuration?: moment.Duration;
	toggleBarStacking?: boolean;
}

/**
 * Update graph options from a link
 * @param options - Object of possible values to dispatch with keys: meterIDs, groupIDs, chartType, barDuration, toggleBarStacking
 * @returns {function(*)}
 */
export function changeOptionsFromLink(options: LinkOptions) {
	const dispatchFirst: Thunk[] = [];
	const dispatchSecond: Array<Thunk | t.ChangeChartToRenderAction | t.ChangeBarStackingAction> = [];
	if (options.meterIDs) {
		dispatchFirst.push(fetchMetersDetailsIfNeeded());
		dispatchSecond.push(changeSelectedMeters(options.meterIDs));
	}
	if (options.groupIDs) {
		dispatchFirst.push(fetchGroupsDetailsIfNeeded());
		dispatchSecond.push(changeSelectedGroups(options.groupIDs));
	}
	if (options.chartType) {
		dispatchSecond.push(changeChartToRender(options.chartType));
	}
	if (options.barDuration) {
		dispatchSecond.push(changeBarDuration(options.barDuration));
	}
	if (options.toggleBarStacking) {
		dispatchSecond.push(changeBarStacking());
	}
	return (dispatch: Dispatch) => Promise.all(dispatchFirst.map(dispatch))
		.then(() => Promise.all(dispatchSecond.map(dispatch)));
}
