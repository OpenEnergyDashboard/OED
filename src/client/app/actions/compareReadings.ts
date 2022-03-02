/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { TimeInterval } from '../../../common/TimeInterval';
import {Dispatch, Thunk, ActionType, GetState} from '../types/redux/actions';
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
 * @returns {boolean} True if the readings for the given meter, and time are missing; false otherwise.
 */
function shouldFetchMeterCompareReadings(state: State, meterID: number, timeInterval: TimeInterval, compareShift: moment.Duration): boolean {
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
	return !readingsForCompareShift.isFetching;
}

/**
 * @param {State} state the Redux state
 * @param {number} groupID the ID of the group to check
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {compareShift} compareShift The time shift between curr and prev
 * @returns {boolean} True if the readings for the given group, and time are missing; false otherwise.
 */
function shouldFetchGroupCompareReadings(state: State, groupID: number, timeInterval: TimeInterval, compareShift: moment.Duration): boolean {
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
	return !readingsForCompareShift.isFetching;
}

function requestMeterCompareReadings(meterIDs: number[], timeInterval: TimeInterval, compareShift: moment.Duration):
	t.RequestMeterCompareReadingAction {
	return { type: ActionType.RequestMeterCompareReading, meterIDs, timeInterval, compareShift };
}

function receiveMeterCompareReadings(meterIDs: number[], timeInterval: TimeInterval, compareShift: moment.Duration, readings: CompareReadings):
	t.ReceiveMeterCompareReadingAction {
	return { type: ActionType.ReceiveMeterCompareReading, meterIDs, timeInterval, compareShift, readings };
}

function requestGroupCompareReadings(groupIDs: number[], timeInterval: TimeInterval, compareShift: moment.Duration):
	t.RequestGroupCompareReadingAction {
	return { type: ActionType.RequestGroupCompareReading, groupIDs, timeInterval, compareShift };
}

function receiveGroupCompareReadings(groupIDs: number[], timeInterval: TimeInterval, compareShift: moment.Duration, readings: CompareReadings):
	t.ReceiveGroupCompareReadingAction {
	return { type: ActionType.ReceiveGroupCompareReading, groupIDs, timeInterval, compareShift, readings };
}

/**
 * Fetch the data for the given meters over the given interval. Fully manages the Redux lifecycle.
 * @param {[number]} meterIDs The IDs of the meters whose data should be fetched
 * @param {ComparePeriod} comparePeriod enum to represent a kind of time shift between curr and prev
 */
function fetchMeterCompareReadings(meterIDs: number[], comparePeriod: ComparePeriod): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		const compareShift = calculateCompareShift(comparePeriod);
		const currTimeInterval = getState().graph.compareTimeInterval;
		dispatch(requestMeterCompareReadings(meterIDs, currTimeInterval, compareShift));
		const readings: CompareReadings = await metersApi.compareReadings(meterIDs, currTimeInterval, compareShift);
		dispatch(receiveMeterCompareReadings(meterIDs, currTimeInterval, compareShift, readings));
	};
}

/**
 * Fetch the data for the given groups over the given interval. Fully manages the Redux lifecycle.
 * @param {[number]} groupIDs The IDs of the groups whose data should be fetched
 * @param {ComparePeriod} comparePeriod enum to represent a kind of time shift between curr and prev
 */
function fetchGroupCompareReadings(groupIDs: number[], comparePeriod: ComparePeriod): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		const compareShift = calculateCompareShift(comparePeriod);
		const currTimeInterval = getState().graph.compareTimeInterval;
		dispatch(requestGroupCompareReadings(groupIDs, currTimeInterval, compareShift));
		const readings = await groupsApi.compareReadings(groupIDs, currTimeInterval, compareShift);
		dispatch(receiveGroupCompareReadings(groupIDs, currTimeInterval, compareShift, readings));
	};
}


/**
 * Fetches readings for the compare chart of all selected meterIDs if they are not already fetched or being fetched
 * @param {ComparePeriod} comparePeriod The period to fetch readings for on the compare chart
 * @return {*} An action to fetch the needed readings
 */
export function fetchNeededCompareReadings(comparePeriod: ComparePeriod): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		const state = getState();
		const compareShift = calculateCompareShift(comparePeriod);
		const timeInterval = state.graph.compareTimeInterval;
		/* tslint:disable:array-type */
		const promises: Array<Promise<any>> = [];
		/* tslint:enable:array-type */

		// Determine which meters are missing data for this time interval
		const meterIDsToFetchForCompare = state.graph.selectedMeters.filter(
			(id: number) => shouldFetchMeterCompareReadings(state, id, timeInterval, compareShift)
		);
		// Fetch data for any missing meters
		if (meterIDsToFetchForCompare.length > 0) {
			promises.push(dispatch(fetchMeterCompareReadings(meterIDsToFetchForCompare, comparePeriod)));
		}

		// Determine which groups are missing data for this time interval
		const groupIDsToFetchForCompare = state.graph.selectedGroups.filter(
			(id: number) => shouldFetchGroupCompareReadings(state, id, timeInterval, compareShift)
		);
		// Fetch data for any missing groups
		if (groupIDsToFetchForCompare.length > 0) {
			promises.push(dispatch(fetchGroupCompareReadings(groupIDsToFetchForCompare, comparePeriod)));
		}
		return Promise.all(promises);
	};
}
