/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import axios from 'axios';

export const REQUEST_LINE_READINGS = 'REQUEST_LINE_READINGS';
export const RECEIVE_LINE_READINGS = 'RECEIVE_LINE_READINGS';

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

function requestLineReadings(meterIDs, timeInterval) {
	return { type: REQUEST_LINE_READINGS, meterIDs, timeInterval };
}

function receiveLineReadings(meterIDs, timeInterval, readings) {
	return { type: RECEIVE_LINE_READINGS, meterIDs, timeInterval, readings };
}

function fetchLineReadings(meterIDs, timeInterval, numPoints) {
	return dispatch => {
		dispatch(requestLineReadings(meterIDs, timeInterval));
		// The api expects the meter ids to be a comma-separated list.
		const stringifiedMeterIDs = meterIDs.join(',');
		return axios.get(`/api/readings/line/${stringifiedMeterIDs}`, {
			params: { timeInterval: timeInterval.toString(), numPoints }
		}).then(response => dispatch(receiveLineReadings(meterIDs, timeInterval, response.data)));
	};
}

/**
 * Fetches readings for the line chart of all selected meterIDs if they are not already fetched or being fetched
 * @param {TimeInterval} timeInterval The time interval to fetch readings for on the line chart
 * @return {*} An action to fetch the needed readings
 */
export function fetchNeededLineReadings(timeInterval, numPoints = 100) {
	return (dispatch, getState) => {
		const state = getState();
		const meterIDsToFetchForLine = state.graph.selectedMeters.filter(id => shouldFetchLineReadings(state, id, timeInterval));
		if (meterIDsToFetchForLine.length > 0) {
			return dispatch(fetchLineReadings(meterIDsToFetchForLine, timeInterval, numPoints));
		}
		return Promise.resolve();
	};
}
