/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import axios from 'axios';
import { DATA_TYPE_METER, DATA_TYPE_GROUP } from '../utils/Datasources';

export const REQUEST_LINE_READINGS = 'REQUEST_LINE_READINGS';
export const RECEIVE_LINE_READINGS = 'RECEIVE_LINE_READINGS';

/**
 * @param {State} state
 * @param {number} meterID
 * @param {TimeInterval} timeInterval
 * @param {String} type either DATA_TYPE_METER, DATA_TYPE_GROUP
 */
function shouldFetchLineReadings(state, dsID, timeInterval, type) {
	let dsArray;
	if (type === DATA_TYPE_GROUP) {
		dsArray = state.readings.line.byGroupID;
	} else if (type === DATA_TYPE_METER) {
		dsArray = state.readings.line.byMeterID;
	}

	const readingsForID = dsArray[dsID];
	if (readingsForID === undefined) {
		return true;
	}
	if (readingsForID[timeInterval] === undefined) {
		return true;
	}
	const readingsForTimeInterval = dsArray[dsID][timeInterval];
	return readingsForTimeInterval === undefined && !readingsForTimeInterval.isFetching;
}

function requestLineReadings(meterIDs, timeInterval) {
	return { type: REQUEST_LINE_READINGS, meterIDs, timeInterval };
}

function receiveLineReadings(meterIDs, timeInterval, readings) {
	return { type: RECEIVE_LINE_READINGS, meterIDs, timeInterval, readings };
}

function fetchLineReadings(dsIDs, timeInterval, type) {
	return dispatch => {
		dispatch(requestLineReadings(dsIDs, timeInterval));
		// The api expects the meter ids to be a comma-separated list.
		const stringifiedIDs = dsIDs.join(',');
		let endpoint;
		if (type === DATA_TYPE_GROUP) {
			endpoint = '/api/readings/line/meters';
		}
		return axios.get(`${endpoint}/${stringifiedMeterIDs}`, {
			params: { timeInterval: timeInterval.toString() }
		}).then(response => dispatch(receiveLineReadings(meterIDs, timeInterval, response.data)));
	};
}

/**
 * Fetches readings for the line chart of all selected meterIDs if they are not already fetched or being fetched
 * @param {TimeInterval} timeInterval The time interval to fetch readings for on the line chart
 * @return {*} An action to fetch the needed readings
 */
export function fetchNeededLineReadings(timeInterval) {
	return (dispatch, getState) => {
		const state = getState();
		const meterIDsToFetchForLine = state.graph.selectedMeters.filter(id => shouldFetchLineReadings(state, id, timeInterval));
		if (meterIDsToFetchForLine.length > 0) {
			return dispatch(fetchLineReadings(meterIDsToFetchForLine, timeInterval));
		}
		return Promise.resolve();
	};
}
