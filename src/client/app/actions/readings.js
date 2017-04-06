/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import axios from 'axios';

export const REQUEST_LINE_READINGS = 'REQUEST_LINE_READINGS';
export const RECEIVE_LINE_READINGS = 'RECEIVE_LINE_READINGS';
export const REQUEST_BAR_READINGS = 'REQUEST_BAR_READINGS';
export const RECEIVE_BAR_READINGS = 'RECEIVE_BAR_READINGS';


/**
 * @param {State} state
 * @param {number} meterID
 * @param {TimeInterval} timeInterval
 */
function shouldFetchLineReadings(state, meterID, timeInterval) {
	const readingsForMeterID = state.readings.line.byMeterID[meterID];
	if (readingsForMeterID === undefined) {
		return true;
	}
	if (readingsForMeterID[timeInterval] === undefined) {
		return true;
	}
	const readingsForTimeInterval = state.readings.line.byMeterID[meterID][timeInterval];
	return readingsForTimeInterval === undefined && !readingsForTimeInterval.isFetching;
}

/**
 * @param {State} state
 * @param {number} meterID
 * @param {TimeInterval} timeInterval
 */
function shouldFetchBarReadings(state, meterID, timeInterval) {
	const readingsForMeterID = state.readings.bar.byMeterID[meterID];
	if (readingsForMeterID === undefined) {
		return true;
	}
	if (readingsForMeterID[timeInterval] === undefined) {
		return true;
	}
	const readingsForTimeInterval = state.readings.bar.byMeterID[meterID][timeInterval];
	return readingsForTimeInterval === undefined && !readingsForTimeInterval.isFetching;
}

function requestLineReadings(meterIDs, timeInterval) {
	return { type: REQUEST_LINE_READINGS, meterIDs, timeInterval };
}

function receiveLineReadings(meterIDs, timeInterval, readings) {
	return { type: RECEIVE_LINE_READINGS, meterIDs, timeInterval, readings };
}

function requestBarReadings(meterIDs, timeInterval) {
	return { type: REQUEST_BAR_READINGS, meterIDs, timeInterval };
}

function receiveBarReadings(meterIDs, timeInterval, readings) {
	return { type: RECEIVE_BAR_READINGS, meterIDs, timeInterval, readings };
}

function fetchLineReadings(meterIDs, timeInterval) {
	return dispatch => {
		dispatch(requestLineReadings(meterIDs, timeInterval));
		// The api expects the meter ids to be a comma-separated list.
		const stringifiedMeterIDs = meterIDs.join(',');
		return axios.get(`/api/readings/line/${stringifiedMeterIDs}`, {
			params: { timeInterval: timeInterval.toString() }
		}).then(response => dispatch(receiveLineReadings(meterIDs, timeInterval, response.data)));
	};
}

function fetchBarReadings(meterIDs, timeInterval) {
	return dispatch => {
		dispatch(requestBarReadings(meterIDs, timeInterval));
		const stringifiedMeterIDs = meterIDs.join(',');
		return axios.get(`/api/readings/bar/${stringifiedMeterIDs}`, {
			params: { timeInterval: timeInterval.toString() }
		}).then(response => dispatch(receiveBarReadings(meterIDs, timeInterval, response.data)));
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
		const meterIDsToFetchForLine = meterIDs.filter(id => shouldFetchLineReadings(state, id, timeInterval));
		const meterIDsToFetchForBar = meterIDs.filter(id => shouldFetchBarReadings(state, id, timeInterval));

		if (meterIDsToFetchForLine.length > 0 && meterIDsToFetchForBar.length > 0) {
			return Promise.all([
				dispatch(fetchLineReadings(meterIDsToFetchForLine, timeInterval)),
				dispatch(fetchBarReadings(meterIDsToFetchForBar, timeInterval))
			]);
		} else if (meterIDsToFetchForLine.length > 0 && meterIDsToFetchForBar.length === 0) {
			return dispatch(fetchLineReadings(meterIDsToFetchForLine, timeInterval));
		} else if (meterIDsToFetchForBar.length === 0 && meterIDsToFetchForBar.length > 0) {
			return dispatch(fetchBarReadings(meterIDsToFetchForBar, timeInterval));
		}
		return Promise.resolve();
	};
}
