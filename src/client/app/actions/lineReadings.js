/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import axios from 'axios';

export const REQUEST_GROUP_LINE_READINGS = 'REQUEST_GROUP_LINE_READINGS';
export const RECEIVE_GROUP_LINE_READINGS = 'RECEIVE_GROUP_LINE_READINGS';

export const REQUEST_METER_LINE_READINGS = 'REQUEST_METER_LINE_READINGS';
export const RECEIVE_METER_LINE_READINGS = 'RECEIVE_METER_LINE_READINGS';

/**
 * @param {State} state The current Redux state
 * @param {number} groupID The ID of the group to check
 * @param {TimeInterval} timeInterval The time interval to check
 * @returns {bool} True if the line readings for the given group at the given time are missing, false otherwise
 */
function shouldFetchGroupLineReadings(state, groupID, timeInterval) {
	const readingsForID = state.readings.line.byGroupID[groupID];
	if (readingsForID === undefined) {
		return true;
	}

	const readingsForTimeInterval = readingsForID[timeInterval];
	if (readingsForID[timeInterval] === undefined) {
		return true;
	}

	return !readingsForTimeInterval.isFetching;
}

/**
 * @param {State} state The current Redux state
 * @param {number} meterID The ID of the meter to check
 * @param {TimeInterval} timeInterval The time interval to check
 * @returns {bool} True if the line readings for the given meter at the given time are missing, false otherwise
 */
function shouldFetchMeterLineReadings(state, meterID, timeInterval) {
	const readingsForID = state.readings.line.byMeterID[meterID];
	if (readingsForID === undefined) {
		return true;
	}

	const readingsForTimeInterval = readingsForID[timeInterval];
	if (readingsForID[timeInterval] === undefined) {
		return true;
	}

	return !readingsForTimeInterval.isFetching;
}

/**
 * @param {[number]} meterIDs The IDs of the meters whose data should be fetched
 * @param {TimeInterval} timeInterval The time interval over which data should be fetched
 */
function requestMeterLineReadings(meterIDs, timeInterval) {
	return { type: REQUEST_METER_LINE_READINGS, meterIDs, timeInterval };
}

/**
 * @param {[number]} meterIDs The IDs of the meters whose data has been fetched
 * @param {TimeInterval} timeInterval The time interval over which data has been fetched
 * @param {*} readings The data that has been fetched, indexed by meter ID.
 */
function receiveMeterLineReadings(meterIDs, timeInterval, readings) {
	return { type: RECEIVE_METER_LINE_READINGS, meterIDs, timeInterval, readings };
}

/**
 * @param {[number]} groupIDs The IDs of the groups whose data should be fetched
 * @param {TimeInterval} timeInterval The time interval over which data should be fetched
 */
function requestGroupLineReadings(groupIDs, timeInterval) {
	return { type: REQUEST_GROUP_LINE_READINGS, groupIDs, timeInterval };
}

/**
 * @param {[number]} groupIDs The IDs of the groups whose data has been fetched
 * @param {TimeInterval} timeInterval The time interval over which data has been fetched
 * @param {*} readings The data that has been fetched, indexed by group ID.
 */
function receiveGroupLineReadings(groupIDs, timeInterval, readings) {
	return { type: RECEIVE_GROUP_LINE_READINGS, groupIDs, timeInterval, readings };
}

/**
 * Fetch the data for the given meters over the given interval. Fully manages the Redux lifecycle.
 * @param {[number]} meterIDs The IDs of the meters whose data should be fetched
 * @param {TimeInterval} timeInterval The time interval over which data should be fetched
 */
function fetchMeterLineReadings(meterIDs, timeInterval) {
	return dispatch => {
		dispatch(requestMeterLineReadings(meterIDs, timeInterval));
		// The api expects the meter IDs to be a comma-separated list.
		const stringifiedIDs = meterIDs.join(',');
		return axios.get(`/api/readings/line/meters/${stringifiedIDs}`, {
			params: { timeInterval: timeInterval.toString() }
		}).then(response => dispatch(receiveMeterLineReadings(meterIDs, timeInterval, response.data)));
	};
}

/**
 * Fetch the data for the given groups over the given interval. Fully manages the Redux lifecycle.
 * @param {[number]} groupIDs The IDs of the groups whose data should be fetched
 * @param {TimeInterval} timeInterval The time interval over which data should be fetched
 */
function fetchGroupLineReadings(groupIDs, timeInterval) {
	return dispatch => {
		dispatch(requestGroupLineReadings(groupIDs, timeInterval));
		// The api expects the group IDs to be a comma-separated list.
		const stringifiedIDs = groupIDs.join(',');
		return axios.get(`/api/readings/line/groups/${stringifiedIDs}`, {
			params: { timeInterval: timeInterval.toString() }
		}).then(response => dispatch(receiveGroupLineReadings(groupIDs, timeInterval, response.data)));
	};
}

/**
 * Fetches readings for the line chart of all selected meters and groups, if needed.
 * @param {TimeInterval} timeInterval The time interval to fetch readings for on the line chart
 * @return {*} Promise resolution of async actions to fetch the needed readings.
 */
export function fetchNeededLineReadings(timeInterval) {
	return (dispatch, getState) => {
		const state = getState();

		// Determine which meters are missing data for this time interval
		const meterIDsToFetchForLine = state.graph.selectedMeters.filter(
			id => shouldFetchMeterLineReadings(state, id, timeInterval)
		);
		if (meterIDsToFetchForLine.length > 0) {
			return dispatch(fetchMeterLineReadings(meterIDsToFetchForLine, timeInterval));
		}

		// Determine which groups are missing data for this time interval
		const groupIDsToFetchForLine = state.graph.selectedGroups.filter(
			id => shouldFetchGroupLineReadings(state, id, timeInterval)
		);
		if (groupIDsToFetchForLine.length > 0) {
			return dispatch(fetchGroupLineReadings(groupIDsToFetchForLine, timeInterval));
		}

		return Promise.resolve();
	};
}
