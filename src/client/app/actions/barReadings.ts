/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { TimeInterval } from '../../../common/TimeInterval';
import { Dispatch, GetState, Thunk, ActionType } from '../types/redux/actions';
import { State } from '../types/redux/state';
import * as t from '../types/redux/barReadings';
import { readingsApi } from '../utils/api';
import { BarReadings } from '../types/readings';

/**
 * @param {State} state the Redux state
 * @param {number} meterID the ID of the meter to check
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {moment.Duration} barDuration the duration of each bar for which to check
 * @param {number} unitID the ID of the unit for which to check
 * @returns {boolean} True if the readings for the given meter, time duration, bar length and unit are missing; false otherwise.
 */
export function shouldFetchMeterBarReadings(state: State, meterID: number, timeInterval: TimeInterval,
	barDuration: moment.Duration, unitID: number): boolean {
	const timeIntervalIndex = timeInterval.toString();
	const barDurationIndex = barDuration.toISOString();

	const readingsForID = state.readings.bar.byMeterID[meterID];
	if (readingsForID === undefined) {
		return true;
	}

	const readingsForTimeInterval = readingsForID[timeIntervalIndex];
	if (readingsForTimeInterval === undefined) {
		return true;
	}

	const readingsForBarDuration = readingsForTimeInterval[barDurationIndex];
	if (readingsForBarDuration === undefined) {
		return true;
	}

	const readingsForUnit = readingsForBarDuration[unitID];
	if (readingsForUnit === undefined) {
		return true;
	}

	return !readingsForUnit.isFetching;
}

/**
 * @param {State} state the Redux state
 * @param {number} groupID the ID of the group to check
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {moment.Duration} barDuration the duration of each bar for which to check
 * @param {number} unitID the ID of the unit for which to check
 * @returns {boolean} True if the readings for the given group, time duration, bar length and unit are missing; false otherwise.
 */
export function shouldFetchGroupBarReadings(state: State, groupID: number, timeInterval: TimeInterval,
	barDuration: moment.Duration, unitID: number): boolean {
	const timeIntervalIndex = timeInterval.toString();
	const barDurationIndex = barDuration.toISOString();

	const readingsForID = state.readings.bar.byGroupID[groupID];
	if (readingsForID === undefined) {
		return true;
	}

	const readingsForTimeInterval = readingsForID[timeIntervalIndex];
	if (readingsForTimeInterval === undefined) {
		return true;
	}

	const readingsForBarDuration = readingsForTimeInterval[barDurationIndex];
	if (readingsForBarDuration === undefined) {
		return true;
	}

	const readingsForUnit = readingsForBarDuration[unitID];
	if (readingsForUnit === undefined) {
		return true;
	}

	return !readingsForUnit.isFetching;
}

/* eslint-disable jsdoc/require-returns */

/**
 * @param {number} meterIDs the IDs of the meters to get readings
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {moment.Duration} barDuration the duration of each bar for which to check
 * @param {number} unitID the ID of the unit for which to check
 */
export function requestMeterBarReadings(meterIDs: number[], timeInterval: TimeInterval, barDuration: moment.Duration,
	unitID: number): t.RequestMeterBarReadingsAction {
	return { type: ActionType.RequestMeterBarReadings, meterIDs, timeInterval, barDuration, unitID };
}

/**
 * @param {number} groupIDs the IDs of the groups to get readings
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {moment.Duration} barDuration the duration of each bar for which to check
 * @param {number} unitID the ID of the unit for which to check
 */
export function requestGroupBarReadings(groupIDs: number[], timeInterval: TimeInterval, barDuration: moment.Duration,
	unitID: number): t.RequestGroupBarReadingsAction {
	return { type: ActionType.RequestGroupBarReadings, groupIDs, timeInterval, barDuration, unitID };
}

/**
 * @param {number} meterIDs the IDs of the meters to get readings
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {moment.Duration} barDuration the duration of each bar for which to check
 * @param {number} unitID the ID of the unit for which to check
 * @param {BarReadings} readings the readings for the given meters
 */
export function receiveMeterBarReadings(meterIDs: number[], timeInterval: TimeInterval, barDuration: moment.Duration,
	unitID: number, readings: BarReadings): t.ReceiveMeterBarReadingsAction {
	return { type: ActionType.ReceiveMeterBarReadings, meterIDs, timeInterval, unitID, barDuration, readings };
}

/**
 * @param {number} groupIDs the IDs of the groups to get readings
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {moment.Duration} barDuration the duration of each bar for which to check
 * @param {number} unitID the ID of the unit for which to check
 * @param {BarReadings} readings the readings for the given groups
 */
export function receiveGroupBarReadings(groupIDs: number[], timeInterval: TimeInterval, barDuration: moment.Duration,
	unitID: number, readings: BarReadings): t.ReceiveGroupBarReadingsAction {
	return { type: ActionType.ReceiveGroupBarReadings, groupIDs, timeInterval, barDuration, unitID, readings };
}

/**
 * @param {number} meterIDs the IDs of the meters to get readings
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {number} unitID the ID of the unit for which to check
 */
function fetchMeterBarReadings(meterIDs: number[], timeInterval: TimeInterval, unitID: number): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		const barDuration = getState().graph.barDuration;
		dispatch(requestMeterBarReadings(meterIDs, timeInterval, barDuration, unitID));
		const meterBarReadings = await readingsApi.meterBarReadings(meterIDs, timeInterval, Math.round(barDuration.asDays()), unitID);
		dispatch(receiveMeterBarReadings(meterIDs, timeInterval, barDuration, unitID, meterBarReadings));
	};
}

/**
 * @param {number} groupIDs the IDs of the groups to get readings
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {number} unitID the ID of the unit for which to check
 */
function fetchGroupBarReadings(groupIDs: number[], timeInterval: TimeInterval, unitID: number): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		const barDuration = getState().graph.barDuration;
		dispatch(requestGroupBarReadings(groupIDs, timeInterval, barDuration, unitID));
		const groupBarReadings = await readingsApi.groupBarReadings(groupIDs, timeInterval, Math.round(barDuration.asDays()), unitID);
		dispatch(receiveGroupBarReadings(groupIDs, timeInterval, barDuration, unitID, groupBarReadings));
	};
}

/**
 * Fetches readings for the bar chart of all selected meters and groups, if needed.
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {number} unitID the ID of the unit for which to check
 */
export function fetchNeededBarReadings(timeInterval: TimeInterval, unitID: number): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		const state = getState();
		const promises: Array<Promise<any>> = [];
		/* tslint:enable:array-type */
		const barDuration = state.graph.barDuration;

		// Determine which meters are missing data for this time interval
		const meterIDsToFetchForBar = state.graph.selectedMeters.filter(
			id => shouldFetchMeterBarReadings(state, id, timeInterval, barDuration, unitID)
		);
		// Fetch data for any missing meters
		if (meterIDsToFetchForBar.length > 0) {
			promises.push(dispatch(fetchMeterBarReadings(meterIDsToFetchForBar, timeInterval, unitID)));
		}

		// Determine which groups are missing data for this time interval
		const groupIDsToFetchForBar = state.graph.selectedGroups.filter(
			id => shouldFetchGroupBarReadings(state, id, timeInterval, barDuration, unitID)
		);
		// Fetch data for any missing groups
		if (groupIDsToFetchForBar.length > 0) {
			promises.push(dispatch(fetchGroupBarReadings(groupIDsToFetchForBar, timeInterval, unitID)));
		}
		return Promise.all(promises);
	};
}
