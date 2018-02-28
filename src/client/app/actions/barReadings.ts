/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { TimeInterval } from '../../../common/TimeInterval';
import { Dispatch, GetState, Thunk, ActionType } from '../types/redux/actions';
import { State } from '../types/redux/state';
import { BarReadings } from '../types/readings';
import * as t from '../types/redux/barReadings';
import api from '../utils/Api';

/**
 * @param {State} state the Redux state
 * @param {number} meterID the ID of the meter to check
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {Moment.Duration} barDuration the duration of each bar for which to check
 * @returns {boolean} True if the readings for the given meter, time, and duration are missing; false otherwise.
 */
function shouldFetchMeterBarReadings(state: State, meterID: number, timeInterval: TimeInterval, barDuration: moment.Duration): boolean {
	const readingsForID = state.readings.bar.byMeterID[meterID];
	if (readingsForID === undefined) {
		return true;
	}

	const readingsForTimeInterval = readingsForID[timeInterval.toString()];
	if (readingsForTimeInterval === undefined) {
		return true;
	}

	const readingsForBarDuration = readingsForTimeInterval[barDuration.toISOString()];
	if (readingsForBarDuration === undefined) {
		return true;
	}

	return !readingsForBarDuration.isFetching;
}

/**
 * @param {State} state the Redux state
 * @param {number} groupID the ID of the group to check
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {Moment.Duration} barDuration the duration of each bar for which to check
 * @returns {boolean} True if the readings for the given group, time, and duration are missing; false otherwise.
 */
function shouldFetchGroupBarReadings(state: State, groupID: number, timeInterval: TimeInterval, barDuration: moment.Duration): boolean {
	const readingsForID = state.readings.bar.byMeterID[groupID];
	if (readingsForID === undefined) {
		return true;
	}

	const readingsForTimeInterval = readingsForID[timeInterval.toString()];
	if (readingsForTimeInterval === undefined) {
		return true;
	}

	const readingsForBarDuration = readingsForTimeInterval[barDuration.toISOString()];
	if (readingsForBarDuration === undefined) {
		return true;
	}

	return !readingsForBarDuration.isFetching;
}

function requestMeterBarReadings(meterIDs: number[], timeInterval: TimeInterval, barDuration: moment.Duration): t.RequestMeterBarReadingsAction {
	return { type: ActionType.RequestMeterBarReadings, meterIDs, timeInterval, barDuration };
}

function receiveMeterBarReadings(meterIDs: number[], timeInterval: TimeInterval, barDuration: moment.Duration, readings: BarReadings):
	t.ReceiveMeterBarReadingsAction {
	return { type: ActionType.ReceiveMeterBarReadings, meterIDs, timeInterval, barDuration, readings };
}

function requestGroupBarReadings(groupIDs: number[], timeInterval: TimeInterval, barDuration: moment.Duration): t.RequestGroupBarReadingsAction {
	return { type: ActionType.RequestGroupBarReadings, groupIDs, timeInterval, barDuration };
}

function receiveGroupBarReadings(groupIDs: number[], timeInterval: TimeInterval, barDuration: moment.Duration, readings: BarReadings):
	t.ReceiveGroupBarReadingsAction {
	return { type: ActionType.ReceiveGroupBarReadings, groupIDs, timeInterval, barDuration, readings };
}

/**
 * Fetch the data for the given meters over the given interval. Fully manages the Redux lifecycle.
 * Reads bar duration from the state.
 * @param {[number]} meterIDs The IDs of the meters whose data should be fetched
 * @param {TimeInterval} timeInterval The time interval over which data should be fetched
 */
function fetchMeterBarReadings(meterIDs: number[], timeInterval: TimeInterval): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		const barDuration = getState().graph.barDuration;
		dispatch(requestMeterBarReadings(meterIDs, timeInterval, barDuration));
		const readings = await api.meterBarReadings(meterIDs, timeInterval, barDuration);
		dispatch(receiveMeterBarReadings(meterIDs, timeInterval, barDuration, readings));
	};
}

/**
 * Fetch the data for the given groups over the given interval. Fully manages the Redux lifecycle.
 * Reads bar duration from the state.
 * @param {[number]} groupIDs The IDs of the groups whose data should be fetched
 * @param {TimeInterval} timeInterval The time interval over which data should be fetched
 */
function fetchGroupBarReadings(groupIDs: number[], timeInterval: TimeInterval): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		const barDuration = getState().graph.barDuration;
		dispatch(requestGroupBarReadings(groupIDs, timeInterval, barDuration));
		// API expectes a comma-seperated string of IDs
		const stringifiedIDs = groupIDs.join(',');
		const readings = await api.groupBarReadings(groupIDs, timeInterval, barDuration);
		dispatch(receiveGroupBarReadings(groupIDs, timeInterval, barDuration, readings));
	};
}

function fetchMeterCompareReadings(meterIDs: number[], timeInterval: TimeInterval): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		const compareDuration = getState().graph.compareDuration;
		dispatch(requestMeterBarReadings(meterIDs, timeInterval, compareDuration));
		const readings = await api.meterBarReadings(meterIDs, timeInterval, compareDuration);
		dispatch(receiveMeterBarReadings(meterIDs, timeInterval, compareDuration, readings));
	};
}

function fetchGroupCompareReadings(groupIDs: number[], timeInterval: TimeInterval) {
	return async (dispatch: Dispatch, getState: GetState) => {
		const compareDuration = getState().graph.compareDuration;
		dispatch(requestGroupBarReadings(groupIDs, timeInterval, compareDuration));
		const readings = await api.groupBarReadings(groupIDs, timeInterval, compareDuration);
		dispatch(receiveGroupBarReadings(groupIDs, timeInterval, compareDuration, readings));
	};
}


/**
 * Fetches readings for the bar chart of all selected meterIDs if they are not already fetched or being fetched
 * @param {TimeInterval} timeInterval The time interval to fetch readings for on the bar chart
 * @return {*} An action to fetch the needed readings
 */
export function fetchNeededBarReadings(timeInterval: TimeInterval): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		const state = getState();
		const promises: Array<Promise<any>> = [];

		// Determine which meters are missing data for this time interval
		const meterIDsToFetchForBar = state.graph.selectedMeters.filter(
			id => shouldFetchMeterBarReadings(state, id, timeInterval, state.graph.barDuration)
		);
		// Fetch data for any missing meters
		if (meterIDsToFetchForBar.length > 0) {
			promises.push(dispatch(fetchMeterBarReadings(meterIDsToFetchForBar, timeInterval)));
		}

		// Determine which groups are missing data for this time interval
		const groupIDsToFetchForBar = state.graph.selectedGroups.filter(
			id => shouldFetchGroupBarReadings(state, id, timeInterval, state.graph.barDuration)
		);
		// Fetch data for any missing groups
		if (groupIDsToFetchForBar.length > 0) {
			promises.push(dispatch(fetchGroupBarReadings(groupIDsToFetchForBar, timeInterval)));
		}
		return Promise.all(promises);
	};
}

export function fetchNeededCompareReadings(timeInterval: TimeInterval): Thunk {
	return (dispatch, getState) => {
		const state = getState();
		const promises: Array<Promise<any>> = [];

		// Determine which meters are missing data for this time interval
		const meterIDsToFetchForCompare = state.graph.selectedMeters.filter(
			id => shouldFetchMeterBarReadings(state, id, timeInterval, state.graph.compareDuration)
		);
		// Fetch data for any missing meters
		if (meterIDsToFetchForCompare.length > 0) {
			promises.push(dispatch(fetchMeterCompareReadings(meterIDsToFetchForCompare, timeInterval)));
		}

		// Determine which groups are missing data for this time interval
		const groupIDsToFetchForCompare = state.graph.selectedGroups.filter(
			id => shouldFetchGroupBarReadings(state, id, timeInterval, state.graph.compareDuration)
		);
		// Fetch data for any missing groups
		if (groupIDsToFetchForCompare.length > 0) {
			promises.push(dispatch(fetchGroupCompareReadings(groupIDsToFetchForCompare, timeInterval)));
		}
		return Promise.all(promises);
	};
}
