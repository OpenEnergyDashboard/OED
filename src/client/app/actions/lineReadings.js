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
 * @param {number} dsID
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

function requestLineReadings(dsIDs, timeInterval, dstype) {
	return { type: REQUEST_LINE_READINGS, dsIDs, timeInterval, dstype };
}

function receiveLineReadings(dsIDs, timeInterval, readings, dstype) {
	return { type: RECEIVE_LINE_READINGS, dsIDs, timeInterval, readings, dstype };
}

function fetchLineReadings(dsIDs, timeInterval, dstype) {
	return dispatch => {
		dispatch(requestLineReadings(dsIDs, timeInterval, dstype));
		// The api expects the meter ids to be a comma-separated list.
		const stringifiedIDs = dsIDs.join(',');
		let endpoint;
		if (dstype === DATA_TYPE_GROUP) {
			endpoint = '/api/readings/line/groups';
		} else if (dstype === DATA_TYPE_METER) {
			endpoint = '/api/readings/line/meters';
		} else {
			console.error('Unknown datatype requested in fetchLineReadings: ', dstype);
			endpoint = '/api/nonexistant';
		}
		return axios.get(`${endpoint}/${stringifiedIDs}`, {
			params: { timeInterval: timeInterval.toString() }
		}).then(response => dispatch(receiveLineReadings(dsIDs, timeInterval, response.data, dstype)));
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
		const meterIDsToFetchForLine = state.graph.selectedMeters.filter(id => shouldFetchLineReadings(state, id, timeInterval, DATA_TYPE_METER));
		if (meterIDsToFetchForLine.length > 0) {
			return dispatch(fetchLineReadings(meterIDsToFetchForLine, timeInterval, DATA_TYPE_METER));
		}
		const groupIDsToFetchForLine = state.graph.selectedGroups.filter(id => shouldFetchLineReadings(state, id, timeInterval, DATA_TYPE_GROUP));
		if (groupIDsToFetchForLine.length > 0) {
			return dispatch(fetchLineReadings(groupIDsToFetchForLine, timeInterval, DATA_TYPE_GROUP));
		}
		return Promise.resolve();
	};
}
