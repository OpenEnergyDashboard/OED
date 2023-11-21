/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TimeInterval } from '../../../common/TimeInterval';
import { ActionType, Thunk, Dispatch, GetState } from '../types/redux/actions';
import { State } from '../types/redux/state';
import * as t from '../types/redux/threeDReadings';
import { ChartTypes, ReadingInterval } from '../types/redux/graph'
import { readingsApi } from '../utils/api';
import { ThreeDReading } from '../types/readings';
import { isValidThreeDInterval, roundTimeIntervalForFetch } from '../utils/dateRangeCompatibility';

/**
 * @param meterID the ID of the meter to get readings
 * @param timeInterval the interval over which to get
 * @param unitID the ID of the unit for which to get
 * @param readingInterval number of readings occurring on the x axis (one day typically corresponds to a y axis tick)
 */
function requestMeterThreeDReadings(meterID: number, timeInterval: TimeInterval, unitID: number, readingInterval: ReadingInterval)
	: t.RequestMeterThreeDReadingsAction {
	return { type: ActionType.RequestMeterThreeDReadings, meterID, timeInterval, unitID, readingInterval };
}

/**
 * @param meterID the ID of the meter to get readings
 * @param timeInterval the interval over which to get
 * @param unitID the ID of the unit for which to get
 * @param readingInterval number of readings occurring on the x axis (one day typically corresponds to a y axis tick)
 * @param readings the readings for the given meters
 */
function receiveMeterThreeDReadings(
	meterID: number, timeInterval: TimeInterval, unitID: number, readingInterval: ReadingInterval, readings: ThreeDReading)
	: t.ReceiveMeterThreeDReadingsAction {
	return { type: ActionType.ReceiveMeterThreeDReadings, meterID, timeInterval, unitID, readingInterval, readings };
}

/**
 * @param meterID the ID of the meter to get readings
 * @param timeInterval the interval over which to get
 * @param unitID the ID of the unit for which to get
 * @param readingInterval number of readings occurring on the x axis (one day typically corresponds to a y axis tick)
 */
function fetchMeterThreeDReadings(meterID: number, timeInterval: TimeInterval, unitID: number, readingInterval: ReadingInterval): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(requestMeterThreeDReadings(meterID, timeInterval, unitID, readingInterval));
		const meterThreeDReadings = await readingsApi.meterThreeDReadings(meterID, timeInterval, unitID, readingInterval);
		dispatch(receiveMeterThreeDReadings(meterID, timeInterval, unitID, readingInterval, meterThreeDReadings));
	};
}

/**
 * Fetches 3D readings for the selected meter if needed.
 */
export function fetchNeededThreeDReadings(): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		const state = getState();
		const selectedMeterOrGroupID = state.graph.threeD.meterOrGroupID;
		const meterOrGroup = state.graph.threeD.meterOrGroup;
		//3D Graphic currently only allows full days. Round start down & end up
		const timeInterval = roundTimeIntervalForFetch(state.graph.timeInterval);

		// only fetch if on 3D page
		// Time interval must be bounded, Infinite intervals not allowed
		// Meter Must Be Selected.
		if (state.graph.chartToRender !== ChartTypes.threeD ||
			!isValidThreeDInterval(timeInterval) ||
			!selectedMeterOrGroupID) {
			return Promise.resolve();
		}
		if (meterOrGroup === 'meters') {
			if (shouldFetchMeterThreeDReadings(state, selectedMeterOrGroupID, timeInterval, state.graph.selectedUnit, state.graph.threeD.readingInterval)) {
				return dispatch(fetchMeterThreeDReadings(selectedMeterOrGroupID, timeInterval, state.graph.selectedUnit, state.graph.threeD.readingInterval));
			}
		} else {
			if (shouldFetchGroupThreeDReadings(state, selectedMeterOrGroupID, timeInterval, state.graph.selectedUnit, state.graph.threeD.readingInterval)) {
				return dispatch(fetchGroupThreeDReadings(selectedMeterOrGroupID, timeInterval, state.graph.selectedUnit, state.graph.threeD.readingInterval));
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
 * @param readingInterval number of readings occurring on the x axis (one day typically corresponds to a y axis tick)
 * @returns True if the readings for the given meter, time duration and unit are missing; false otherwise.
 */
function shouldFetchMeterThreeDReadings(state: State, meterID: number, timeInterval: TimeInterval, unitID: number, readingInterval: ReadingInterval)
	: boolean {
	const timeIntervalIndex = timeInterval.toString();
	// Optional chaining returns undefined if any of the properties in the chain aren't present
	const hasReadings = state.readings.threeD.byMeterID[meterID]?.[timeIntervalIndex]?.[unitID]?.[readingInterval]?.readings;
	// return true if readings aren't present.
	return !hasReadings;
}

/**
 * @param groupID the ID of the group to get readings
 * @param timeInterval the interval over which to get
 * @param unitID the ID of the unit for which to get
 * @param readingInterval number of readings occurring on the x axis (one day typically corresponds to a y axis tick)
 */
function requestGroupThreeDReadings(groupID: number, timeInterval: TimeInterval, unitID: number, readingInterval: ReadingInterval)
	: t.RequestGroupThreeDReadingsAction {
	return { type: ActionType.RequestGroupThreeDReadings, groupID, timeInterval, unitID, readingInterval };
}

/**
 * @param groupID the ID of the group to get readings
 * @param timeInterval the interval over which to check
 * @param unitID the ID of the unit for which to check
 * @param readingInterval number of readings occurring on the x axis (one day typically corresponds to a y axis tick)
 * @param readings the readings for the given group
 */
function receiveGroupThreeDReadings(
	groupID: number, timeInterval: TimeInterval, unitID: number, readingInterval: ReadingInterval, readings: ThreeDReading)
	: t.ReceiveGroupThreeDReadingsAction {
	return { type: ActionType.ReceiveGroupThreeDReadings, groupID, timeInterval, unitID, readingInterval, readings };
}

/**
 * @param groupID the ID of the group to get readings
 * @param timeInterval the interval over which to check
 * @param unitID the ID of the unit for which to check
 * @param readingInterval number of readings occurring on the x axis (one day typically corresponds to a y axis tick)
 */
function fetchGroupThreeDReadings(groupID: number, timeInterval: TimeInterval, unitID: number, readingInterval: ReadingInterval): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(requestGroupThreeDReadings(groupID, timeInterval, unitID, readingInterval));
		const groupThreeDReadings = await readingsApi.groupThreeDReadings(groupID, timeInterval, unitID, readingInterval);
		dispatch(receiveGroupThreeDReadings(groupID, timeInterval, unitID, readingInterval, groupThreeDReadings));
	};
}

/**
 * @param state the Redux state
 * @param groupID the ID of the group to check
 * @param timeInterval the interval over which to check
 * @param unitID the ID of the unit for which to check
 * @param readingInterval number of readings occurring on the x axis (one day typically corresponds to a y axis tick)
 * @returns True if the readings for the given group, time duration and unit are missing; false otherwise.
 */
function shouldFetchGroupThreeDReadings(
	state: State, groupID: number, timeInterval: TimeInterval, unitID: number, readingInterval: ReadingInterval): boolean {
	const timeIntervalIndex = timeInterval.toString();
	// Optional chaining returns undefined if any of the properties in the chain aren't present
	const hasReadings = state.readings.threeD.byGroupID[groupID]?.[timeIntervalIndex]?.[unitID]?.[readingInterval]?.readings;
	// return true if readings aren't present.
	return !hasReadings;
}
