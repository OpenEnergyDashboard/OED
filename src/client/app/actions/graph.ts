/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { fetchMetersDetailsIfNeeded } from './meters';
import { fetchGroupsDetailsIfNeeded } from './groups';
import { fetchNeededLineReadings } from './lineReadings';
import { fetchNeededBarReadings } from './barReadings';
import { fetchNeededCompareReadings } from './compareReadings';
import { TimeInterval } from '../../../common/TimeInterval';
import { Dispatch, Thunk, GetState } from '../types/redux/actions';
import { State } from '../types/redux/state';
import * as t from '../types/redux/graph';
import * as m from '../types/redux/map';
import { ComparePeriod, SortingOrder } from '../utils/calculateCompare';
import { fetchNeededMapReadings } from './mapReadings';
import { changeSelectedMap, fetchMapsDetails } from './map';
import { fetchUnitsDetailsIfNeeded } from './units';
import { AreaUnitType } from '../utils/getAreaUnitConversion';
import { graphSlice } from '../reducers/graph';

export function setHotlinkedAsync(hotlinked: boolean): Thunk {
	return (dispatch: Dispatch) => {
		dispatch(graphSlice.actions.setHotlinked(hotlinked));
		return Promise.resolve();
	};
}

export function toggleOptionsVisibility() {
	return graphSlice.actions.toggleOptionsVisibility();
}

function changeGraphZoom(timeInterval: TimeInterval) {
	return graphSlice.actions.changeGraphZoom(timeInterval);
}

export function changeBarDuration(barDuration: moment.Duration): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		dispatch(graphSlice.actions.updateBarDuration(barDuration));
		dispatch(fetchNeededBarReadings(getState().graph.timeInterval, getState().graph.selectedUnit));
		return Promise.resolve();
	};
}

function updateComparePeriod(comparePeriod: ComparePeriod, currentTime: moment.Moment) {
	return graphSlice.actions.updateComparePeriod({ comparePeriod, currentTime });
}

export function changeCompareGraph(comparePeriod: ComparePeriod): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		// Here there is no shift since we want to do it in terms of the current time in the browser.
		// Note this does mean that if someone is in a different time zone then they may be ahead of
		// reading on the server (so get 0 readings for those times) or behind (so miss recent readings).
		// TODO At some point we may want to see if we can use the server time to avoid this.
		dispatch(updateComparePeriod(comparePeriod, moment()));
		dispatch((dispatch2: Dispatch) => {
			dispatch2(fetchNeededCompareReadings(comparePeriod, getState().graph.selectedUnit));
		});
		return Promise.resolve();
	};
}

export function changeCompareSortingOrder(compareSortingOrder: SortingOrder) {
	return graphSlice.actions.changeCompareSortingOrder(compareSortingOrder);
}

export function changeSelectedMeters(meterIDs: number[]): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		dispatch(graphSlice.actions.updateSelectedMeters(meterIDs));
		// Nesting dispatches to preserve that updateSelectedMeters() is called before fetching readings
		dispatch((dispatch2: Dispatch) => {
			dispatch2(fetchNeededLineReadings(getState().graph.timeInterval, getState().graph.selectedUnit));
			dispatch2(fetchNeededBarReadings(getState().graph.timeInterval, getState().graph.selectedUnit));
			dispatch2(fetchNeededCompareReadings(getState().graph.comparePeriod, getState().graph.selectedUnit));
			dispatch2(fetchNeededMapReadings(getState().graph.timeInterval, getState().graph.selectedUnit));
		});
		return Promise.resolve();
	};
}

export function changeSelectedGroups(groupIDs: number[]): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		dispatch(graphSlice.actions.updateSelectedGroups(groupIDs));
		// Nesting dispatches to preserve that updateSelectedGroups() is called before fetching readings
		dispatch((dispatch2: Dispatch) => {
			dispatch2(fetchNeededLineReadings(getState().graph.timeInterval, getState().graph.selectedUnit));
			dispatch2(fetchNeededBarReadings(getState().graph.timeInterval, getState().graph.selectedUnit));
			dispatch2(fetchNeededCompareReadings(getState().graph.comparePeriod, getState().graph.selectedUnit));
			dispatch2(fetchNeededMapReadings(getState().graph.timeInterval, getState().graph.selectedUnit));
		});
		return Promise.resolve();
	};
}

export function changeSelectedUnit(unitID: number): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		dispatch(graphSlice.actions.updateSelectedUnit(unitID));
		dispatch((dispatch2: Dispatch) => {
			dispatch(fetchNeededLineReadings(getState().graph.timeInterval, unitID));
			dispatch2(fetchNeededBarReadings(getState().graph.timeInterval, unitID));
			dispatch2(fetchNeededCompareReadings(getState().graph.comparePeriod, unitID));
			dispatch2(fetchNeededMapReadings(getState().graph.timeInterval, unitID));
		});
		return Promise.resolve();
	}
}

function fetchNeededReadingsForGraph(timeInterval: TimeInterval, unitID: number): Thunk {
	return (dispatch: Dispatch) => {
		dispatch(fetchNeededLineReadings(timeInterval, unitID));
		dispatch(fetchNeededBarReadings(timeInterval, unitID));
		dispatch(fetchNeededMapReadings(timeInterval, unitID));
		return Promise.resolve();
	};
}

function shouldChangeGraphZoom(state: State, timeInterval: TimeInterval): boolean {
	return !state.graph.timeInterval.equals(timeInterval);
}

export function changeGraphZoomIfNeeded(timeInterval: TimeInterval): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		if (shouldChangeGraphZoom(getState(), timeInterval)) {
			dispatch(resetRangeSliderStack());
			dispatch(changeGraphZoom(timeInterval));
			dispatch(fetchNeededReadingsForGraph(timeInterval, getState().graph.selectedUnit));
		}
		return Promise.resolve();
	};
}

function shouldChangeRangeSlider(range: TimeInterval): boolean {
	return range !== TimeInterval.unbounded();
}

function changeRangeSlider(sliderInterval: TimeInterval) {
	return graphSlice.actions.changeSliderRange(sliderInterval);
}

/**
 * remove constraints for rangeslider after user clicked redraw or restore
 * by setting sliderRange to an empty string
 */
function resetRangeSliderStack() {
	return graphSlice.actions.resetRangeSliderStack();
}

function changeRangeSliderIfNeeded(interval: TimeInterval): Thunk {
	return (dispatch: Dispatch) => {
		if (shouldChangeRangeSlider(interval)) {
			dispatch(changeRangeSlider(interval));
		}
		return Promise.resolve();
	};
}

export function updateThreeDReadingInterval(readingInterval: t.ReadingInterval): Thunk {
	return (dispatch: Dispatch) => {
		dispatch(graphSlice.actions.updateThreeDReadingInterval(readingInterval));
		return Promise.resolve();
	};
}

export function updateThreeDMeterOrGroupInfo(meterOrGroupID: t.MeterOrGroupID | undefined, meterOrGroup: t.MeterOrGroup) {
	return graphSlice.actions.updateThreeDMeterOrGroupInfo({ meterOrGroupID, meterOrGroup });
}

export function changeMeterOrGroupInfo(meterOrGroupID: t.MeterOrGroupID | undefined, meterOrGroup: t.MeterOrGroup = t.MeterOrGroup.meters): Thunk {
	// Meter ID can be null, however meterOrGroup defaults to meters a null check on ID can be sufficient
	return (dispatch: Dispatch) => {
		dispatch(updateThreeDMeterOrGroupInfo(meterOrGroupID, meterOrGroup));
		return Promise.resolve();
	};
}

export interface LinkOptions {
	meterIDs?: number[];
	groupIDs?: number[];
	chartType?: t.ChartTypes;
	unitID?: number;
	rate?: t.LineGraphRate;
	barDuration?: moment.Duration;
	serverRange?: TimeInterval;
	sliderRange?: TimeInterval;
	toggleAreaNormalization?: boolean;
	areaUnit?: string;
	toggleMinMax?: boolean;
	toggleBarStacking?: boolean;
	comparePeriod?: ComparePeriod;
	compareSortingOrder?: SortingOrder;
	optionsVisibility?: boolean;
	mapID?: number;
	meterOrGroupID?: number;
	meterOrGroup?: t.MeterOrGroup;
	readingInterval?: t.ReadingInterval;
}

/**
 * Update graph options from a link
 * @param options - Object of possible values to dispatch with keys: meterIDs, groupIDs, chartType, barDuration, toggleBarStacking, ...
 */
export function changeOptionsFromLink(options: LinkOptions) {
	const dispatchFirst: Thunk[] = [setHotlinkedAsync(true)];
	const dispatchSecond: Array<Thunk | m.UpdateSelectedMapAction | ReturnType<typeof graphSlice.actions[keyof typeof graphSlice.actions]>> = [];
	if (options.meterIDs) {
		dispatchFirst.push(fetchMetersDetailsIfNeeded());
		dispatchSecond.push(changeSelectedMeters(options.meterIDs));
	}
	if (options.groupIDs) {
		dispatchFirst.push(fetchGroupsDetailsIfNeeded());
		dispatchSecond.push(changeSelectedGroups(options.groupIDs));
	}
	if (options.meterOrGroupID && options.meterOrGroup) {
		dispatchSecond.push(updateThreeDMeterOrGroupInfo(options.meterOrGroupID, options.meterOrGroup));
	}
	if (options.chartType) {
		dispatchSecond.push(graphSlice.actions.changeChartToRender(options.chartType));
	}
	if (options.unitID) {
		dispatchFirst.push(fetchUnitsDetailsIfNeeded());
		dispatchSecond.push(changeSelectedUnit(options.unitID));
	}
	if (options.rate) {
		dispatchSecond.push(graphSlice.actions.updateLineGraphRate(options.rate));
	}
	if (options.barDuration) {
		dispatchFirst.push(changeBarDuration(options.barDuration));
	}
	if (options.serverRange) {
		dispatchSecond.push(changeGraphZoomIfNeeded(options.serverRange));
	}
	if (options.sliderRange) {
		dispatchSecond.push(changeRangeSliderIfNeeded(options.sliderRange));
	}
	if (options.toggleAreaNormalization) {
		dispatchSecond.push(graphSlice.actions.toggleAreaNormalization());
	}
	if (options.areaUnit) {
		dispatchSecond.push(graphSlice.actions.updateSelectedAreaUnit(options.areaUnit as AreaUnitType));
	}
	if (options.toggleMinMax) {
		dispatchSecond.push(graphSlice.actions.toggleShowMinMax());
	}
	if (options.toggleBarStacking) {
		dispatchSecond.push(graphSlice.actions.changeBarStacking());
	}
	if (options.comparePeriod) {
		dispatchSecond.push(changeCompareGraph(options.comparePeriod));
	}
	if (options.compareSortingOrder) {
		dispatchSecond.push(changeCompareSortingOrder(options.compareSortingOrder));
	}
	if (options.optionsVisibility != null) {
		dispatchSecond.push(toggleOptionsVisibility());
	}
	if (options.mapID) {
		// TODO here and elsewhere should be IfNeeded but need to check that all state updates are done when edit, etc.
		dispatchFirst.push(fetchMapsDetails());
		dispatchSecond.push(changeSelectedMap(options.mapID));
	}
	if (options.readingInterval) {
		dispatchSecond.push(updateThreeDReadingInterval(options.readingInterval));
	}
	return (dispatch: Dispatch) => Promise.all(dispatchFirst.map(dispatch))
		.then(() => Promise.all(dispatchSecond.map(dispatch)));
}
