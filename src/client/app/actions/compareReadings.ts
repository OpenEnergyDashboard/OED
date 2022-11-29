/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { TimeInterval } from '../../../common/TimeInterval';
import { Dispatch, Thunk, ActionType, GetState } from '../types/redux/actions';
import { State } from '../types/redux/state';
import { CompareReadings } from '../types/readings';
import * as t from '../types/redux/compareReadings';
import { metersApi, groupsApi } from '../utils/api';
import { ComparePeriod, calculateCompareShift } from '../utils/calculateCompare';

/**
 * @param {State} state the Redux state
 * @param {number} meterID the ID of the meter to check
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {compareShift} compareShift The time shift between curr and prev
 * @param {number} unitID the ID of the unit for which to check
 * @returns {boolean} True if the readings for the given meter, time and unit are missing; false otherwise.
 */
function shouldFetchMeterCompareReadings(state: State, meterID: number, timeInterval: TimeInterval,
	compareShift: moment.Duration, unitID: number): boolean {
	const readingsForID = state.readings.compare.byMeterID[meterID];
	if (readingsForID === undefined) {
		return true;
	}
	const readingsForTimeInterval = readingsForID[timeInterval.toString()];
	if (readingsForTimeInterval === undefined) {
		return true;
	}
	const readingsForCompareShift = readingsForTimeInterval[compareShift.toISOString()];
	if (readingsForCompareShift === undefined) {
		return true;
	}

	const readingsForUnit = readingsForCompareShift[unitID];
	if (readingsForUnit === undefined) {
		return true;
	}

	return !readingsForUnit.isFetching;
}

/**
 * @param {State} state the Redux state
 * @param {number} groupID the ID of the group to check
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {compareShift} compareShift The time shift between curr and prev
 * @param {number} unitID the ID of the unit for which to check
 * @returns {boolean} True if the readings for the given group, and time are missing; false otherwise.
 */
function shouldFetchGroupCompareReadings(state: State, groupID: number, timeInterval: TimeInterval,
	compareShift: moment.Duration, unitID: number): boolean {
	const readingsForID = state.readings.compare.byGroupID[groupID];
	if (readingsForID === undefined) {
		return true;
	}
	const readingsForTimeInterval = readingsForID[timeInterval.toString()];
	if (readingsForTimeInterval === undefined) {
		return true;
	}
	const readingsForCompareShift = readingsForTimeInterval[compareShift.toISOString()];
	if (readingsForCompareShift === undefined) {
		return true;
	}

	const readingsForUnit = readingsForCompareShift[unitID];
	if (readingsForUnit === undefined) {
		return true;
	}

	return !readingsForUnit.isFetching;
}

/**
 * @param {number} meterIDs the IDs of the meters to get readings
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {moment.Duration} compareShift time to shift the timeInterval to get previous interval
 * @param {number} unitID the ID of the unit for which to check
 */
function requestMeterCompareReadings(meterIDs: number[], timeInterval: TimeInterval,
	compareShift: moment.Duration, unitID: number):
	t.RequestMeterCompareReadingsAction {
	return { type: ActionType.RequestMeterCompareReadings, meterIDs, timeInterval, compareShift, unitID };
}

/**
 * @param {number} groupIDs the IDs of the groups to get readings
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {moment.Duration} compareShift time to shift the timeInterval to get previous interval
 * @param {number} unitID the ID of the unit for which to check
 */
function requestGroupCompareReadings(groupIDs: number[], timeInterval: TimeInterval,
	compareShift: moment.Duration, unitID: number):
	t.RequestGroupCompareReadingsAction {
	return { type: ActionType.RequestGroupCompareReadings, groupIDs, timeInterval, compareShift, unitID };
}

/**
 * @param {number} meterIDs the IDs of the meters to get readings
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {moment.Duration} compareShift time to shift the timeInterval to get previous interval
 * @param {number} unitID the ID of the unit for which to check
 * @param {CompareReadings} readings the readings for the given meters
 */
function receiveMeterCompareReadings(meterIDs: number[], timeInterval: TimeInterval, compareShift: moment.Duration,
	unitID: number, readings: CompareReadings): t.ReceiveMeterCompareReadingsAction {
	return { type: ActionType.ReceiveMeterCompareReadings, meterIDs, timeInterval, compareShift, unitID, readings };
}

/**
 * @param {number} groupIDs the IDs of the groups to get readings
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {moment.Duration} compareShift time to shift the timeInterval to get previous interval
 * @param {number} unitID the ID of the unit for which to check
 * @param {CompareReadings} readings the readings for the given meters
 */
function receiveGroupCompareReadings(groupIDs: number[], timeInterval: TimeInterval, compareShift: moment.Duration,
	unitID: number, readings: CompareReadings): t.ReceiveGroupCompareReadingsAction {
	return { type: ActionType.ReceiveGroupCompareReadings, groupIDs, timeInterval, compareShift, unitID, readings };
}

/**
 * @param {number} meterIDs the IDs of the meters to get readings
 * @param {ComparePeriod} comparePeriod the period over which to check
 * @param {number} unitID the ID of the unit for which to check
 */
function fetchMeterCompareReadings(meterIDs: number[], comparePeriod: ComparePeriod, unitID: number): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		const compareShift = calculateCompareShift(comparePeriod);
		const currTimeInterval = getState().graph.compareTimeInterval;
		dispatch(requestMeterCompareReadings(meterIDs, currTimeInterval, compareShift, unitID));
		const readings: CompareReadings = await metersApi.meterCompareReadings(meterIDs, currTimeInterval, compareShift, unitID);
		dispatch(receiveMeterCompareReadings(meterIDs, currTimeInterval, compareShift, unitID, readings));
	};
}

/**
 * Fetch the data for the given groups over the given interval. Fully manages the Redux lifecycle.
 * @param {[number]} groupIDs The IDs of the groups whose data should be fetched
 * @param {ComparePeriod} comparePeriod enum to represent a kind of time shift between curr and prev
 * @param {number} unitID the ID of the unit for which to check
 */
function fetchGroupCompareReadings(groupIDs: number[], comparePeriod: ComparePeriod, unitID: number): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		const compareShift = calculateCompareShift(comparePeriod);
		const currTimeInterval = getState().graph.compareTimeInterval;
		dispatch(requestGroupCompareReadings(groupIDs, currTimeInterval, compareShift, unitID));
		const readings = await groupsApi.groupCompareReadings(groupIDs, currTimeInterval, compareShift, unitID);
		dispatch(receiveGroupCompareReadings(groupIDs, currTimeInterval, compareShift, unitID, readings));
	};
}


/**
 * Fetches readings for the compare chart of all selected meterIDs if they are not already fetched or being fetched
 * @param {ComparePeriod} comparePeriod The period to fetch readings for on the compare chart
 * @param {number} unitID the ID of the unit for which to check
 * @returns {*} An action to fetch the needed readings
 */
export function fetchNeededCompareReadings(comparePeriod: ComparePeriod, unitID: number): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		const state = getState();
		const compareShift = calculateCompareShift(comparePeriod);
		const timeInterval = state.graph.compareTimeInterval;
		const promises: Array<Promise<any>> = [];

		// Determine which meters are missing data for this time interval
		const meterIDsToFetchForCompare = state.graph.selectedMeters.filter(
			(id: number) => shouldFetchMeterCompareReadings(state, id, timeInterval, compareShift, unitID)
		);
		// Fetch data for any missing meters
		if (meterIDsToFetchForCompare.length > 0) {
			promises.push(dispatch(fetchMeterCompareReadings(meterIDsToFetchForCompare, comparePeriod, unitID)));
		}

		// Determine which groups are missing data for this time interval
		const groupIDsToFetchForCompare = state.graph.selectedGroups.filter(
			(id: number) => shouldFetchGroupCompareReadings(state, id, timeInterval, compareShift, unitID)
		);
		// Fetch data for any missing groups
		if (groupIDsToFetchForCompare.length > 0) {
			promises.push(dispatch(fetchGroupCompareReadings(groupIDsToFetchForCompare, comparePeriod, unitID)));
		}
		return Promise.all(promises);
	};
}
