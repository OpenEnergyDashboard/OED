/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TimeInterval } from '../../../common/TimeInterval';
import { ActionType, Thunk, Dispatch, GetState } from '../types/redux/actions';
import { State } from '../types/redux/state';
import * as t from '../types/redux/threeDReadings';
import { ChartTypes, ThreeDReadingPrecision } from '../types/redux/graph'
import { readingsApi } from '../utils/api';
import { ThreeDReading } from '../types/readings';
import { isValidThreeDInterval, roundTimeIntervalForFetch } from '../utils/dateRangeCompatability';

/**
 * @param meterID the IDs of the meters to get readings
 * @param timeInterval the interval over which to check
 * @param unitID the ID of the unit for which to check
 * @param readingCount number of readings occurring on the x axis (one day typically corresponds to a y axis tick)
 */
function requestMeterThreeDReadings(meterID: number, timeInterval: TimeInterval, unitID: number, readingCount: ThreeDReadingPrecision)
	: t.RequestMeterThreeDReadingsAction {
	return { type: ActionType.RequestMeterThreeDReadings, meterID, timeInterval, unitID, precision: readingCount };
}

/**
 * @param meterID the IDs of the meters to get readings
 * @param timeInterval the interval over which to check
 * @param unitID the ID of the unit for which to check
 * @param readingCount number of readings occurring on the x axis (one day typically corresponds to a y axis tick)
 * @param readings the readings for the given meters
 */
function receiveMeterThreeDReadings(
	meterID: number, timeInterval: TimeInterval, unitID: number, readingCount: ThreeDReadingPrecision, readings: ThreeDReading)
	: t.ReceiveMeterThreeDReadingsAction {
	return { type: ActionType.ReceiveMeterThreeDReadings, meterID, timeInterval, unitID, precision: readingCount, readings };
}

/**
 * @param meterID the IDs of the meters to get readings
 * @param timeInterval the interval over which to check
 * @param unitID the ID of the unit for which to check
 * @param precision number of readings occurring on the x axis (one day typically corresponds to a y axis tick)
 */
function fetchMeterThreeDReadings(meterID: number, timeInterval: TimeInterval, unitID: number, precision: ThreeDReadingPrecision): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(requestMeterThreeDReadings(meterID, timeInterval, unitID, precision));
		const meterThreeDReadings = await readingsApi.meterThreeDReadings(meterID, timeInterval, unitID);
		dispatch(receiveMeterThreeDReadings(meterID, timeInterval, unitID, precision, meterThreeDReadings));
	};
}

/**
 * Fetches 3D readings for the selected meter if needed.
 * @param timeInterval - Time Interval to be queried.
 */
export function fetchNeededThreeDReadings(): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		const state = getState();
		const selectedMeterOrGroupID = state.graph.threeD.meterOrGroupInfo.meterOrGroupID;
		const meterOrGroup = state.graph.threeD.meterOrGroupInfo.meterOrGroup;
		//3D Graphic currently only allows full days. Round start down && end up

		const timeInterval = roundTimeIntervalForFetch(state.graph.timeInterval);

		if (state.graph.chartToRender !== ChartTypes.threeD || // only fetch if 3D Component
			!isValidThreeDInterval(timeInterval) || // Time interval must be bounded, Infinite intervals not allowed
			!selectedMeterOrGroupID)// no meter selected
		{
			return Promise.resolve();
		}
		if (meterOrGroup === 'meters') {
			if (shouldFetchMeterThreeDReadings(state, selectedMeterOrGroupID, timeInterval, state.graph.selectedUnit, state.graph.threeD.xAxisPrecision)) {
				return dispatch(fetchMeterThreeDReadings(selectedMeterOrGroupID, timeInterval, state.graph.selectedUnit, state.graph.threeD.xAxisPrecision));
			}
		} else {
			if (shouldFetchGroupThreeDReadings(state, selectedMeterOrGroupID, timeInterval, state.graph.selectedUnit, state.graph.threeD.xAxisPrecision)) {
				return dispatch(fetchGroupThreeDReadings(selectedMeterOrGroupID, timeInterval, state.graph.selectedUnit, state.graph.threeD.xAxisPrecision));
			}
		}

		return Promise.resolve();
	};
}

/**
 * @param state the Redux state
 * @param meterID the ID of the meter to check
 * @param timeInterval the interval over which to check
 * @param unitID the ID of the unit for which to check
 * @param precision number of readings occurring on the x axis (one day typically corresponds to a y axis tick)
 * @returns True if the readings for the given meter, time duration and unit are missing; false otherwise.
 */
// function shouldFetchMeterThreeDReadings(state: State, meterID: number, timeInterval: TimeInterval, unitID: number): boolean {
function shouldFetchMeterThreeDReadings(state: State, meterID: number, timeInterval: TimeInterval, unitID: number, precision: ThreeDReadingPrecision)
	: boolean {
	const timeIntervalIndex = timeInterval.toString();
	// Optional chaining returns undefined if any of the properties in the chain aren't present
	const hasReadings = state.readings.threeD.byMeterID[meterID]?.[timeIntervalIndex]?.[unitID]?.[precision]?.readings;
	// return true if readings aren't present.
	return !hasReadings ? true : false;
}

//////////////
/**
 * @param groupID the IDs of the groups to get readings
 * @param timeInterval the interval over which to check
 * @param unitID the ID of the unit for which to check
 * @param readingCount number of readings occurring on the x axis (one day typically corresponds to a y axis tick)
 */
function requestGroupThreeDReadings(groupID: number, timeInterval: TimeInterval, unitID: number, readingCount: ThreeDReadingPrecision)
	: t.RequestGroupThreeDReadingsAction {
	return { type: ActionType.RequestGroupThreeDReadings, groupID, timeInterval, unitID, precision: readingCount };
}

/**
 * @param groupID the IDs of the groups to get readings
 * @param timeInterval the interval over which to check
 * @param unitID the ID of the unit for which to check
 * @param readingCount number of readings occurring on the x axis (one day typically corresponds to a y axis tick)
 * @param readings the readings for the given groups
 */
function receiveGroupThreeDReadings(
	groupID: number, timeInterval: TimeInterval, unitID: number, readingCount: ThreeDReadingPrecision, readings: ThreeDReading)
	: t.ReceiveGroupThreeDReadingsAction {
	return { type: ActionType.ReceiveGroupThreeDReadings, groupID, timeInterval, unitID, precision: readingCount, readings };
}

/**
 * @param groupID the IDs of the groups to get readings
 * @param timeInterval the interval over which to check
 * @param unitID the ID of the unit for which to check
 * @param precision number of readings occurring on the x axis (one day typically corresponds to a y axis tick)
 */
function fetchGroupThreeDReadings(groupID: number, timeInterval: TimeInterval, unitID: number, precision: ThreeDReadingPrecision): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(requestGroupThreeDReadings(groupID, timeInterval, unitID, precision));
		const groupThreeDReadings = await readingsApi.groupThreeDReadings(groupID, timeInterval, unitID);
		dispatch(receiveGroupThreeDReadings(groupID, timeInterval, unitID, precision, groupThreeDReadings));
	};
}

/**
 * @param state the Redux state
 * @param groupID the ID of the group to check
 * @param timeInterval the interval over which to check
 * @param unitID the ID of the unit for which to check
 * @param precision number of readings occurring on the x axis (one day typically corresponds to a y axis tick)
 * @returns True if the readings for the given group, time duration and unit are missing; false otherwise.
 */
function shouldFetchGroupThreeDReadings(state: State, groupID: number, timeInterval: TimeInterval, unitID: number, precision: ThreeDReadingPrecision)
	: boolean {
	const timeIntervalIndex = timeInterval.toString();
	// Optional chaining returns undefined if any of the properties in the chain aren't present
	const hasReadings = state.readings.threeD.byGroupID[groupID]?.[timeIntervalIndex]?.[unitID]?.[precision]?.readings;
	// return true if readings aren't present.
	return !hasReadings ? true : false;
}