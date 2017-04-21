/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import axios from 'axios';

export const REQUEST_BAR_READINGS = 'REQUEST_BAR_READINGS';
export const RECEIVE_BAR_READINGS = 'RECEIVE_BAR_READINGS';

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

function requestBarReadings(meterIDs, timeInterval, barDuration) {
	return { type: REQUEST_BAR_READINGS, meterIDs, timeInterval, barDuration };
}

function receiveBarReadings(meterIDs, timeInterval, barDuration, readings) {
	return { type: RECEIVE_BAR_READINGS, meterIDs, timeInterval, barDuration, readings };
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
