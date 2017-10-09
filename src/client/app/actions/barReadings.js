/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import axios from 'axios';
import { DATA_TYPE_METER, DATA_TYPE_GROUP } from '../utils/Datasources';

export const REQUEST_BAR_READINGS = 'REQUEST_BAR_READINGS';
export const RECEIVE_BAR_READINGS = 'RECEIVE_BAR_READINGS';

/**
 * @param {State} state
 * @param {number} meterID
 * @param {TimeInterval} timeInterval
 * @param {Moment.Duration} barDuration
 */
function shouldFetchBarReadings(state, dsID, timeInterval, barDuration, dstype) {
	let readingsForID;
	if (dstype === DATA_TYPE_METER) {
		readingsForID = state.readings.bar.byMeterID[dsID];
	} else if (dstype === DATA_TYPE_GROUP) {
		readingsForID = state.readings.bar.byGroupID[dsID];
	}
	if (readingsForID === undefined) {
		return true;
	}
	if (readingsForID[timeInterval] === undefined) {
		return true;
	}
	if (readingsForID[timeInterval][barDuration] === undefined) {
		return true;
	}
	const readingsForTimeIntervalAndDuration = readingsForID[timeInterval][barDuration];
	return readingsForTimeIntervalAndDuration === undefined && !readingsForTimeIntervalAndDuration.isFetching;
}

function requestBarReadings(dsIDs, timeInterval, barDuration, dstype) {
	return { type: REQUEST_BAR_READINGS, dsIDs, timeInterval, barDuration, dstype };
}

function receiveBarReadings(dsIDs, timeInterval, barDuration, readings, dstype) {
	return { type: RECEIVE_BAR_READINGS, dsIDs, timeInterval, barDuration, readings, dstype };
}

function fetchBarReadings(dsIDs, timeInterval, dstype) {
	return (dispatch, getState) => {
		const barDuration = getState().graph.barDuration;
		dispatch(requestBarReadings(dsIDs, timeInterval, barDuration, dstype));
		const stringifiedIDs = dsIDs.join(',');

		let endpoint;
		if (dstype === DATA_TYPE_METER) {
			endpoint = '/api/readings/bar/meters';
		} else if (dstype === DATA_TYPE_GROUP) {
			endpoint = '/api/readings/bar/groups';
		}

		return axios.get(`${endpoint}/${stringifiedIDs}`, {
			params: { timeInterval: timeInterval.toString(), barDuration: barDuration.toISOString() }
		}).then(response => dispatch(receiveBarReadings(dsIDs, timeInterval, barDuration, response.data, dstype)));
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
		const meterIDsToFetchForBar = state.graph.selectedMeters.filter(id => shouldFetchBarReadings(state, id, timeInterval, state.graph.barDuration, DATA_TYPE_METER));
		if (meterIDsToFetchForBar.length > 0) {
			return dispatch(fetchBarReadings(meterIDsToFetchForBar, timeInterval, DATA_TYPE_METER));
		}
		const groupIDsToFetchForBar = state.graph.selectedMeters.filter(id => shouldFetchBarReadings(state, id, timeInterval, state.graph.barDuration, DATA_TYPE_GROUP));
		if (groupIDsToFetchForBar.length > 0) {
			return dispatch(fetchBarReadings(groupIDsToFetchForBar, timeInterval, DATA_TYPE_GROUP));
		}
		return Promise.resolve();
	};
}
