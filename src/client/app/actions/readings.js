/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import axios from 'axios';

export const REQUEST_READINGS = 'REQUEST_READINGS';
export const RECEIVE_READINGS = 'RECEIVE_READINGS';
export const REQUEST_MANY_READINGS = 'REQUEST_MANY_READINGS';
export const RECEIVE_MANY_READINGS = 'RECEIVE_MANY_READINGS';

/**
 * @param {int} meterID
 * @param {TimeInterval} timeInterval
 * @param readings
 * @return {{type: string, meterID: *, timeInterval: *, readings: *}}
 */
function receiveReadings(meterID, timeInterval, readings) {
	return { type: RECEIVE_READINGS, meterID, timeInterval, readings };
}

/**
 * @param meterID
 * @param {TimeInterval} timeInterval
 * @return {{type: string, meterID: *, timeInterval: *}}
 */
function requestReadings(meterID, timeInterval) {
	return { type: REQUEST_READINGS, meterID, timeInterval };
}

/**
 * @param meterID
 * @param {TimeInterval} timeInterval
 * @return {function(*)}
 */
function fetchReadings(meterID, timeInterval) {
	return dispatch => {
		dispatch(requestReadings(meterID, timeInterval));
		// This ensures that we don't send undefined timestamps to the server.
		return axios.get(`/api/meters/readings/${meterID}`, {
			params: {
				timeInterval: timeInterval.toString()
			}
		}).then(response => dispatch(receiveReadings(meterID, timeInterval, response.data[meterID])));
	};
}

/**
 * @param {State} state
 * @param {number} meterID
 * @param {TimeInterval} timeInterval
 */
function shouldFetchReadings(state, meterID, timeInterval) {
	const readingsForMeterID = state.readings.byMeterID[meterID];
	if (readingsForMeterID === undefined) {
		return true;
	}
	if (readingsForMeterID[timeInterval] === undefined) {
		return true;
	}
	const readingsForTimeInterval = state.readings.byMeterID[meterID][timeInterval];
	return readingsForTimeInterval === undefined || !readingsForTimeInterval.isFetching;
}

export function fetchReadingsIfNeeded(meterID, timeInterval) {
	return (dispatch, getState) => {
		if (shouldFetchReadings(getState(), meterID, timeInterval)) {
			return dispatch(fetchReadings(meterID, timeInterval));
		}
		return Promise.resolve();
	};
}

function requestManyReadings(meterIDs, timeInterval) {
	return { type: REQUEST_MANY_READINGS, meterIDs, timeInterval };
}

function receiveManyReadings(meterIDs, timeInterval, readings) {
	return { type: RECEIVE_MANY_READINGS, meterIDs, timeInterval, readings };
}

function fetchManyReadings(meterIDs, timeInterval) {
	return dispatch => {
		dispatch(requestManyReadings(meterIDs, timeInterval));
		// The api expects the meter ids to be a comma-separated list.
		const stringifiedMeterIDs = meterIDs.join(',');
		return axios.get(`/api/meters/readings/${stringifiedMeterIDs}`, {
			params: { timeInterval: timeInterval.toString() }
		}).then(response => {
			console.log(response.data);
			return dispatch(receiveManyReadings(meterIDs, timeInterval, response.data));
		});
	};
}

/**
 * Fetches readings for the given meterIDs if they are not already fetched or being fetched
 * @param {Array.<int>} meterIDs
 * @param {TimeInterval} timeInterval The time interval to fetch readings for
 * @return {*} An action to fetch the needed readings
 */
export function fetchNeededReadings(meterIDs, timeInterval) {
	return (dispatch, getState) => {
		const state = getState();
		const meterIDsToFetch = meterIDs.filter(id => shouldFetchReadings(state, id, timeInterval));
		if (meterIDsToFetch.length > 0) {
			return dispatch(fetchManyReadings(meterIDsToFetch, timeInterval));
		}
		return Promise.resolve();
	};
}
