/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import moment from 'moment';
import { fetchMetersDetailsIfNeeded } from './meters';
import { fetchGroupsDetailsIfNeeded } from './groups';
import { fetchNeededLineReadings } from './lineReadings';
import { fetchNeededBarReadings } from './barReadings';
import { fetchNeededCompareReadings } from './compareReadings';
import { fetchNeededRadarReadings } from './radarReadings';
import { TimeInterval } from '../../../common/TimeInterval';
import { Dispatch, Thunk, ActionType, GetState } from '../types/redux/actions';
import { State } from '../types/redux/state';
import * as t from '../types/redux/graph';
import * as m from '../types/redux/map';
import { ComparePeriod, SortingOrder } from '../utils/calculateCompare';
import { fetchNeededMapReadings } from './mapReadings';
import { changeSelectedMap, fetchMapsDetails } from './map';
import { fetchUnitsDetailsIfNeeded } from './units';
import { AreaUnitType } from '../utils/getAreaUnitConversion';
import { fetchNeededThreeDReadings } from './threeDReadings';

export function changeRenderOnce() {
	return { type: ActionType.ConfirmGraphRenderOnce };
}

export function changeChartToRender(chartType: t.ChartTypes): t.ChangeChartToRenderAction {
	return { type: ActionType.ChangeChartToRender, chartType };
}

export function toggleAreaNormalization(): t.ToggleAreaNormalizationAction {
	return { type: ActionType.ToggleAreaNormalization };
}
export function toggleShowMinMax(): t.ToggleShowMinMaxAction {
	return { type: ActionType.ToggleShowMinMax }
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

export function updateSelectedUnit(unitID: number): t.UpdateSelectedUnitAction {
	return { type: ActionType.UpdateSelectedUnit, unitID };
}

export function updateSelectedAreaUnit(areaUnit: AreaUnitType): t.UpdateSelectedAreaUnitAction {
	return { type: ActionType.UpdateSelectedAreaUnit, areaUnit };
}

export function updateBarDuration(barDuration: moment.Duration): t.UpdateBarDurationAction {
	return { type: ActionType.UpdateBarDuration, barDuration };
}

export function updateLineGraphRate(lineGraphRate: t.LineGraphRate): t.UpdateLineGraphRate {
	return { type: ActionType.UpdateLineGraphRate, lineGraphRate }
}

export function setHotlinked(hotlinked: boolean): t.SetHotlinked {
	return { type: ActionType.SetHotlinked, hotlinked };
}

export function setHotlinkedAsync(hotlinked: boolean): Thunk {
	return (dispatch: Dispatch) => {
		dispatch(setHotlinked(hotlinked));
		return Promise.resolve();
	};
}

export function toggleOptionsVisibility(): t.ToggleOptionsVisibility {
	return { type: ActionType.ToggleOptionsVisibility };
}

function changeGraphZoom(timeInterval: TimeInterval): t.ChangeGraphZoomAction {
	return { type: ActionType.ChangeGraphZoom, timeInterval };
}

export function changeBarDuration(barDuration: moment.Duration): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		dispatch(updateBarDuration(barDuration));
		dispatch(fetchNeededBarReadings(getState().graph.timeInterval, getState().graph.selectedUnit));
		return Promise.resolve();
	};
}

function updateComparePeriod(comparePeriod: ComparePeriod, currentTime: moment.Moment): t.UpdateComparePeriodAction {
	return {
		type: ActionType.UpdateComparePeriod,
		comparePeriod,
		currentTime
	};
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

export function changeCompareSortingOrder(compareSortingOrder: SortingOrder): t.ChangeCompareSortingOrderAction {
	return { type: ActionType.ChangeCompareSortingOrder, compareSortingOrder };
}

export function changeSelectedMeters(meterIDs: number[]): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		dispatch(updateSelectedMeters(meterIDs));
		// Nesting dispatches to preserve that updateSelectedMeters() is called before fetching readings
		dispatch((dispatch2: Dispatch) => {
			dispatch2(fetchNeededLineReadings(getState().graph.timeInterval, getState().graph.selectedUnit));
			dispatch2(fetchNeededBarReadings(getState().graph.timeInterval, getState().graph.selectedUnit));
			dispatch2(fetchNeededCompareReadings(getState().graph.comparePeriod, getState().graph.selectedUnit));
			dispatch2(fetchNeededMapReadings(getState().graph.timeInterval, getState().graph.selectedUnit));
			dispatch2(fetchNeededRadarReadings(getState().graph.timeInterval, getState().graph.selectedUnit));
			dispatch2(fetchNeededThreeDReadings());
		});
		return Promise.resolve();
	};
}

export function changeSelectedGroups(groupIDs: number[]): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		dispatch(updateSelectedGroups(groupIDs));
		// Nesting dispatches to preserve that updateSelectedGroups() is called before fetching readings
		dispatch((dispatch2: Dispatch) => {
			dispatch2(fetchNeededLineReadings(getState().graph.timeInterval, getState().graph.selectedUnit));
			dispatch2(fetchNeededBarReadings(getState().graph.timeInterval, getState().graph.selectedUnit));
			dispatch2(fetchNeededCompareReadings(getState().graph.comparePeriod, getState().graph.selectedUnit));
			dispatch2(fetchNeededMapReadings(getState().graph.timeInterval, getState().graph.selectedUnit));
			dispatch2(fetchNeededRadarReadings(getState().graph.timeInterval, getState().graph.selectedUnit));
			dispatch2(fetchNeededThreeDReadings());
		});
		return Promise.resolve();
	};
}

export function changeSelectedUnit(unitID: number): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		dispatch(updateSelectedUnit(unitID));
		dispatch((dispatch2: Dispatch) => {
			dispatch(fetchNeededLineReadings(getState().graph.timeInterval, unitID));
			dispatch2(fetchNeededBarReadings(getState().graph.timeInterval, unitID));
			dispatch2(fetchNeededCompareReadings(getState().graph.comparePeriod, unitID));
			dispatch2(fetchNeededMapReadings(getState().graph.timeInterval, unitID));
			dispatch2(fetchNeededRadarReadings(getState().graph.timeInterval, unitID));
			dispatch2(fetchNeededThreeDReadings());
		});
		return Promise.resolve();
	}
}

function fetchNeededReadingsForGraph(timeInterval: TimeInterval, unitID: number): Thunk {
	return (dispatch: Dispatch) => {
		dispatch(fetchNeededLineReadings(timeInterval, unitID));
		dispatch(fetchNeededBarReadings(timeInterval, unitID));
		dispatch(fetchNeededMapReadings(timeInterval, unitID));
		dispatch(fetchNeededRadarReadings(timeInterval, unitID));
		dispatch(fetchNeededThreeDReadings());
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

function changeRangeSlider(sliderInterval: TimeInterval): t.ChangeSliderRangeAction {
	return { type: ActionType.ChangeSliderRange, sliderInterval };
}

/**
 * remove constraints for rangeslider after user clicked redraw or restore
 * by setting sliderRange to an empty string
 */
function resetRangeSliderStack(): t.ResetRangeSliderStackAction {
	return { type: ActionType.ResetRangeSliderStack };
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
		dispatch({ type: ActionType.UpdateThreeDReadingInterval, readingInterval });
		return dispatch(fetchNeededThreeDReadings());
	};
}

export function updateThreeDMeterOrGroupInfo(meterOrGroupID: t.MeterOrGroupID, meterOrGroup: t.MeterOrGroup): t.UpdateThreeDMeterOrGroupInfo {
	return { type: ActionType.UpdateThreeDMeterOrGroupInfo, meterOrGroupID, meterOrGroup };
}

export function changeMeterOrGroupInfo(meterOrGroupID: t.MeterOrGroupID, meterOrGroup: t.MeterOrGroup = t.MeterOrGroup.meters): Thunk {
	// Meter ID can be null, however meterOrGroup defaults to meters a null check on ID can be sufficient
	return (dispatch: Dispatch) => {
		dispatch(updateThreeDMeterOrGroupInfo(meterOrGroupID, meterOrGroup));
		return dispatch(fetchNeededThreeDReadings());
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
	// Visual Studio indents after the first line in autoformat but ESLint does not like that in this case so override.
	/* eslint-disable @typescript-eslint/indent */
	const dispatchSecond: Array<Thunk | t.ChangeChartToRenderAction | t.ChangeBarStackingAction |
		t.ChangeGraphZoomAction | t.ChangeCompareSortingOrderAction | t.ToggleOptionsVisibility |
		m.UpdateSelectedMapAction | t.UpdateLineGraphRate | t.ToggleAreaNormalizationAction |
		t.UpdateSelectedAreaUnitAction | t.UpdateThreeDMeterOrGroupInfo |
		t.ToggleShowMinMaxAction> = [];
	/* eslint-enable @typescript-eslint/indent */

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
		dispatchSecond.push(changeChartToRender(options.chartType));
	}
	if (options.unitID) {
		dispatchFirst.push(fetchUnitsDetailsIfNeeded());
		dispatchSecond.push(changeSelectedUnit(options.unitID));
	}
	if (options.rate) {
		dispatchSecond.push(updateLineGraphRate(options.rate));
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
		dispatchSecond.push(toggleAreaNormalization());
	}
	if (options.areaUnit) {
		dispatchSecond.push(updateSelectedAreaUnit(options.areaUnit as AreaUnitType));
	}
	if (options.toggleMinMax) {
		dispatchSecond.push(toggleShowMinMax());
	}
	if (options.toggleBarStacking) {
		dispatchSecond.push(changeBarStacking());
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
