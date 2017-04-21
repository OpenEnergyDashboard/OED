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
 * @param {Moment duration} barDuration
 */
function shouldFetchBarReadings(state, meterID, timeInterval, barDuration) {
	const readingsForMeterID = state.readings.bar.byMeterID[meterID];
	if (readingsForMeterID === undefined) {
		return true;
	}
	if (readingsForMeterID[timeInterval] === undefined) {
		return true;
	}
	if (readingsForMeterID[timeInterval][barDuration] === undefined) {
		return true;
	}
	const readingsForTimeIntervalAndDuration = state.readings.bar.byMeterID[meterID][timeInterval][barDuration];
	return readingsForTimeIntervalAndDuration === undefined && !readingsForTimeIntervalAndDuration.isFetching;
}

function requestLineReadings(meterIDs, timeInterval) {
	return { type: REQUEST_LINE_READINGS, meterIDs, timeInterval };
}

function receiveLineReadings(meterIDs, timeInterval, readings) {
	return { type: RECEIVE_LINE_READINGS, meterIDs, timeInterval, readings };
}

function requestBarReadings(meterIDs, timeInterval, barDuration) {
	return { type: REQUEST_BAR_READINGS, meterIDs, timeInterval, barDuration };
}

function receiveBarReadings(meterIDs, timeInterval, barDuration, readings) {
	return { type: RECEIVE_BAR_READINGS, meterIDs, timeInterval, barDuration, readings };
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
	return (dispatch, getState) => {
		const barDuration = getState().graph.barDuration;
		dispatch(requestBarReadings(meterIDs, timeInterval, barDuration));
		const stringifiedMeterIDs = meterIDs.join(',');
		return axios.get(`/api/readings/bar/${stringifiedMeterIDs}`, {
			params: { timeInterval: timeInterval.toString(), barDuration: barDuration.toISOString() }
		}).then(response => dispatch(receiveBarReadings(meterIDs, timeInterval, barDuration, response.data)));
	};
}

/**
 * Fetches readings for all charts for the given meterIDs if they are not already fetched or being fetched
 * @param {Array.<int>} meterIDs
 * @param {TimeInterval} timeInterval The time interval to fetch readings for on the line chart
 * @return {*} An action to fetch the needed readings
 */
export function fetchAllNeededReadings(meterIDs, timeInterval) {
	return (dispatch, getState) => {
		const state = getState();
		const meterIDsToFetchForLine = meterIDs.filter(id => shouldFetchLineReadings(state, id, timeInterval));
		const meterIDsToFetchForBar = meterIDs.filter(id => shouldFetchBarReadings(state, id, timeInterval, state.graph.barDuration));

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

/**
 * Fetches readings for the bar chart of all selected meterIDs if they are not already fetched or being fetched
 * @param {TimeInterval} timeInterval The time interval to fetch readings for on the bar chart
 * @return {*} An action to fetch the needed readings
 */
export function fetchNeededBarReadings(timeInterval) {
	return (dispatch, getState) => {
		const state = getState();
		const meterIDsToFetchForBar = state.graph.selectedMeters.filter(id => shouldFetchBarReadings(state, id, timeInterval, state.graph.barDuration));
		if (meterIDsToFetchForBar.length > 0) {
			return dispatch(fetchBarReadings(meterIDsToFetchForBar, timeInterval));
		}
		return Promise.resolve();
	};
}
