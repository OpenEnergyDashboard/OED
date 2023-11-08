/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { TimeInterval } from '../../../common/TimeInterval';
import { graphSlice } from '../reducers/graph';
import { Dispatch, GetState, Thunk } from '../types/redux/actions';
import * as t from '../types/redux/graph';
import { ComparePeriod, SortingOrder } from '../utils/calculateCompare';
import { fetchNeededMapReadings } from './mapReadings';

export function setHotlinkedAsync(hotlinked: boolean): Thunk {
	return (dispatch: Dispatch) => {
		dispatch(graphSlice.actions.setHotlinked(hotlinked));
		return Promise.resolve();
	};
}

export function toggleOptionsVisibility() {
	return graphSlice.actions.toggleOptionsVisibility();
}

export function changeCompareSortingOrder(compareSortingOrder: SortingOrder) {
	return graphSlice.actions.changeCompareSortingOrder(compareSortingOrder);
}

export function changeSelectedMeters(meterIDs: number[]): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		dispatch(graphSlice.actions.updateSelectedMeters(meterIDs));
		// Nesting dispatches to preserve that updateSelectedMeters() is called before fetching readings
		dispatch((dispatch2: Dispatch) => {
			dispatch2(fetchNeededMapReadings(getState().graph.queryTimeInterval, getState().graph.selectedUnit));
		});
		return Promise.resolve();
	};
}

export function changeSelectedGroups(groupIDs: number[]): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		dispatch(graphSlice.actions.updateSelectedGroups(groupIDs));
		// Nesting dispatches to preserve that updateSelectedGroups() is called before fetching readings
		dispatch((dispatch2: Dispatch) => {
			dispatch2(fetchNeededMapReadings(getState().graph.queryTimeInterval, getState().graph.selectedUnit));
		});
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
