import axios from 'axios';
import { stringifyTimeInterval } from '../util';

export const REQUEST_READINGS = 'REQUEST_READINGS';
export const RECEIVE_READINGS = 'RECEIVE_READINGS';

function receiveReadings(meterID, startTimestamp, endTimestamp, readings) {
	return { type: RECEIVE_READINGS, meterID, startTimestamp, endTimestamp, readings };
}

function requestReadings(meterID, startTimestamp, endTimestamp) {
	return { type: REQUEST_READINGS, meterID, startTimestamp, endTimestamp };
}

function fetchReadings(meterID, startTimestamp, endTimestamp) {
	return dispatch => {
		dispatch(requestReadings(meterID, startTimestamp, endTimestamp));
		// This ensures that we don't send undefined timestamps to the server.
		let axiosParams;
		if (startTimestamp || endTimestamp) {
			axiosParams = { startTimestamp, endTimestamp };
		} else {
			axiosParams = {};
		}
		return axios.get(`/api/meters/readings/${meterID}`, {
			params: axiosParams
		}).then(response => dispatch(receiveReadings(meterID, startTimestamp, endTimestamp, response.data)));
	};
}

/**
 * @param {State} state
 * @param {number} meterID
 * @param startTimestamp
 * @param endTimestamp
 */
function shouldFetchReadings(state, meterID, startTimestamp, endTimestamp) {
	const readingsForMeterID = state.readings.byMeterID[meterID];
	if (readingsForMeterID === undefined) {
		return true;
	}
	const timeInterval = stringifyTimeInterval(startTimestamp, endTimestamp);
	if (readingsForMeterID[timeInterval] === undefined) {
		return true;
	}
	const readingsForTimeInterval = state.readings.byMeterID[meterID][timeInterval];
	return readingsForTimeInterval === undefined || !readingsForTimeInterval.isFetching;
}

export function fetchReadingsIfNeeded(meterID, startTimestamp, endTimestamp) {
	return (dispatch, getState) => {
		if (shouldFetchReadings(getState(), meterID, startTimestamp, endTimestamp)) {
			return dispatch(fetchReadings(meterID, startTimestamp, endTimestamp));
		}
		return Promise.resolve();
	};
}
