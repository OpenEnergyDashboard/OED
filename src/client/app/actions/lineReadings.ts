/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TimeInterval } from '../../../common/TimeInterval';
import { ActionType, Thunk, Dispatch, GetState } from '../types/redux/actions';
import { State } from '../types/redux/state';
import * as t from '../types/redux/lineReadings';
import { readingsApi } from '../utils/api';
import { LineReadings } from '../types/readings';

/**
 * @param {State} state the Redux state
 * @param {number} meterID the ID of the meter to check
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {number} unitID the ID of the unit for which to check
 * @returns {boolean} True if the readings for the given meter, time duration and unit are missing; false otherwise.
 */
 function shouldFetchMeterLineReadings(state: State, meterID: number, timeInterval: TimeInterval, unitID: number): boolean {
	const timeIntervalIndex = timeInterval.toString();

	const readingsForID = state.readings.line.byMeterID[meterID];
	if (readingsForID === undefined) {
		return true;
	}

	const readingsForTimeInterval = readingsForID[timeIntervalIndex];
	if (readingsForTimeInterval === undefined) {
		return true;
	}

	const readingsForUnit = readingsForTimeInterval[unitID];
	if (readingsForUnit === undefined) {
		return true;
	}

	return !readingsForUnit.isFetching;
}

/**
 * @param {State} state the Redux state
 * @param {number} groupID the ID of the group to check
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {number} unitID the ID of the unit for which to check
 * @returns {boolean} True if the readings for the given group, time duration and unit are missing; false otherwise.
 */
 function shouldFetchGroupLineReadings(state: State, groupID: number, timeInterval: TimeInterval, unitID: number): boolean {
	const timeIntervalIndex = timeInterval.toString();

	const readingsForID = state.readings.line.byGroupID[groupID];
	if (readingsForID === undefined) {
		return true;
	}

	const readingsForTimeInterval = readingsForID[timeIntervalIndex];
	if (readingsForTimeInterval === undefined) {
		return true;
	}

	const readingsForUnit = readingsForTimeInterval[unitID];
	if (readingsForUnit === undefined) {
		return true;
	}

	return !readingsForUnit.isFetching;
}

/**
 * @param {number} meterIDs the IDs of the meters to get readings
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {number} unitID the ID of the unit for which to check
 */
function requestMeterLineReadings(meterIDs: number[], timeInterval: TimeInterval, unitID: number): t.RequestMeterLineReadingsAction {
	return { type: ActionType.RequestMeterLineReadings, meterIDs, timeInterval, unitID };
}

/**
 * @param {number} groupIDs the IDs of the groups to get readings
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {number} unitID the ID of the unit for which to check
 */
 function requestGroupLineReadings(groupIDs: number[], timeInterval: TimeInterval, unitID: number): t.RequestGroupLineReadingsAction {
	return { type: ActionType.RequestGroupLineReadings, groupIDs, timeInterval, unitID };
}

/**
 * @param {number} meterIDs the IDs of the meters to get readings
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {number} unitID the ID of the unit for which to check
 * @param {LineReadings} readings the readings for the given meters
 */
 function receiveMeterLineReadings(
	meterIDs: number[], timeInterval: TimeInterval, unitID: number, readings: LineReadings): t.ReceiveMeterLineReadingsAction {
	return { type: ActionType.ReceiveMeterLineReadings, meterIDs, timeInterval, unitID, readings };
}

/**
 * @param {number} groupIDs the IDs of the groups to get readings
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {number} unitID the ID of the unit for which to check
 * @param {LineReadings} readings the readings for the given groups
 */
 function receiveGroupLineReadings(
	groupIDs: number[], timeInterval: TimeInterval, unitID: number, readings: LineReadings): t.ReceiveGroupLineReadingsAction {
	return { type: ActionType.ReceiveGroupLineReadings, groupIDs, timeInterval, unitID, readings };
}

/**
 * @param {number} meterIDs the IDs of the meters to get readings
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {number} unitID the ID of the unit for which to check
 */
function fetchMeterLineReadings(meterIDs: number[], timeInterval: TimeInterval, unitID: number): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(requestMeterLineReadings(meterIDs, timeInterval, unitID));
		const meterLineReadings = await readingsApi.meterLineReadings(meterIDs, timeInterval, unitID);
		dispatch(receiveMeterLineReadings(meterIDs, timeInterval, unitID, meterLineReadings));
	};
}

/**
 * @param {number} groupIDs the IDs of the groups to get readings
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {number} unitID the ID of the unit for which to check
 */
function fetchGroupLineReadings(groupIDs: number[], timeInterval: TimeInterval, unitID: number): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(requestGroupLineReadings(groupIDs, timeInterval, unitID));
		const groupLineReadings = await readingsApi.groupLineReadings(groupIDs, timeInterval, unitID);
		dispatch(receiveGroupLineReadings(groupIDs, timeInterval, unitID, groupLineReadings));
	};
}

/**
 * Fetches readings for the line chart of all selected meters and groups, if needed.
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {number} unitID the ID of the unit for which to check
 */
 export function fetchNeededLineReadings(timeInterval: TimeInterval, unitID: number): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		const state = getState();
		const promises: Array<Promise<any>> = [];

		// Determine which meters are missing data for this time interval
		const meterIDsToFetchForLine = state.graph.selectedMeters.filter(
			id => shouldFetchMeterLineReadings(state, id, timeInterval, unitID)
		);
		if (meterIDsToFetchForLine.length > 0) {
			promises.push(dispatch(fetchMeterLineReadings(meterIDsToFetchForLine, timeInterval, unitID)));
		}

		// Determine which groups are missing data for this time interval
		const groupIDsToFetchForLine = state.graph.selectedGroups.filter(
			id => shouldFetchGroupLineReadings(state, id, timeInterval, unitID)
		);
		if (groupIDsToFetchForLine.length > 0) {
			promises.push(dispatch(fetchGroupLineReadings(groupIDsToFetchForLine, timeInterval, unitID)));
		}

		return Promise.all(promises);
	};
}
