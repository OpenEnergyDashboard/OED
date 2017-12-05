/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import axios from 'axios';

export const REQUEST_GROUP_BAR_READINGS = 'REQUEST_GROUP_BAR_READINGS';
export const RECEIVE_GROUP_BAR_READINGS = 'RECEIVE_GROUP_BAR_READINGS';

export const REQUEST_METER_BAR_READINGS = 'REQUEST_METER_BAR_READINGS';
export const RECEIVE_METER_BAR_READINGS = 'RECEIVE_METER_BAR_READINGS';

/**
 * @param {State} state the Redux state
 * @param {number} meterID the ID of the meter to check
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {Moment.Duration} barDuration the duration of each bar for which to check
 * @returns {boolean} True if the readings for the given meter, time, and duration are missing; false otherwise.
 */
function shouldFetchMeterBarReadings(state, meterID, timeInterval, barDuration) {
	const readingsForID = state.readings.bar.byMeterID[meterID];
	if (readingsForID === undefined) {
		return true;
	}

	const readingsForTimeInterval = readingsForID[timeInterval];
	if (readingsForTimeInterval === undefined) {
		return true;
	}

	const readingsForBarDuration = readingsForTimeInterval[barDuration];
	if (readingsForBarDuration === undefined) {
		return true;
	}

	return !readingsForBarDuration.isFetching;
}

/**
 * @param {State} state the Redux state
 * @param {number} groupID the ID of the group to check
 * @param {TimeInterval} timeInterval the interval over which to check
 * @param {Moment.Duration} barDuration the duration of each bar for which to check
 * @returns {boolean} True if the readings for the given group, time, and duration are missing; false otherwise.
 */
function shouldFetchGroupBarReadings(state, groupID, timeInterval, barDuration) {
	const readingsForID = state.readings.bar.byMeterID[groupID];
	if (readingsForID === undefined) {
		return true;
	}

	const readingsForTimeInterval = readingsForID[timeInterval];
	if (readingsForTimeInterval === undefined) {
		return true;
	}

	const readingsForBarDuration = readingsForTimeInterval[barDuration];
	if (readingsForBarDuration === undefined) {
		return true;
	}

	return !readingsForBarDuration.isFetching;
}

function requestMeterBarReadings(meterIDs, timeInterval, barDuration) {
	return { type: REQUEST_METER_BAR_READINGS, meterIDs, timeInterval, barDuration };
}

function receiveMeterBarReadings(meterIDs, timeInterval, barDuration, readings) {
	return { type: RECEIVE_METER_BAR_READINGS, meterIDs, timeInterval, barDuration, readings };
}

function requestGroupBarReadings(groupIDs, timeInterval, barDuration) {
	return { type: REQUEST_GROUP_BAR_READINGS, groupIDs, timeInterval, barDuration };
}

function receiveGroupBarReadings(groupIDs, timeInterval, barDuration, readings) {
	return { type: RECEIVE_GROUP_BAR_READINGS, groupIDs, timeInterval, barDuration, readings };
}

/**
 * Fetch the data for the given meters over the given interval. Fully manages the Redux lifecycle.
 * Reads bar duration from the state.
 * @param {[number]} meterIDs The IDs of the meters whose data should be fetched
 * @param {TimeInterval} timeInterval The time interval over which data should be fetched
 */
function fetchMeterBarReadings(meterIDs, timeInterval) {
	return (dispatch, getState) => {
		const barDuration = getState().graph.barDuration;
		dispatch(requestMeterBarReadings(meterIDs, timeInterval, barDuration));
		// API expectes a comma-seperated string of IDs
		const stringifiedIDs = meterIDs.join(',');

		return axios.get(`/api/readings/bar/meters/${stringifiedIDs}`, {
			params: { timeInterval: timeInterval.toString(), barDuration: barDuration.toISOString() }
		}).then(response => dispatch(receiveMeterBarReadings(meterIDs, timeInterval, barDuration, response.data)));
	};
}

/**
 * Fetch the data for the given groups over the given interval. Fully manages the Redux lifecycle.
 * Reads bar duration from the state.
 * @param {[number]} groupIDs The IDs of the groups whose data should be fetched
 * @param {TimeInterval} timeInterval The time interval over which data should be fetched
 */
function fetchGroupBarReadings(groupIDs, timeInterval) {
	return (dispatch, getState) => {
		const barDuration = getState().graph.barDuration;
		dispatch(requestGroupBarReadings(groupIDs, timeInterval, barDuration));
		// API expectes a comma-seperated string of IDs
		const stringifiedIDs = groupIDs.join(',');

		return axios.get(`/api/readings/bar/groups/${stringifiedIDs}`, {
			params: { timeInterval: timeInterval.toString(), barDuration: barDuration.toISOString() }
		}).then(response => dispatch(receiveGroupBarReadings(groupIDs, timeInterval, barDuration, response.data)));
	};
}

function fetchCompareReadings(meterIDs, timeInterval) {
	return (dispatch, getState) => {
		const compareDuration = getState().graph.compareDuration;
		dispatch(requestMeterBarReadings(meterIDs, timeInterval, compareDuration));
		const stringifiedMeterIDs = meterIDs.join(',');
		return axios.get(`/api/readings/bar/meters/${stringifiedMeterIDs}`, {
			params: { timeInterval: timeInterval, barDuration: compareDuration.toISOString() }
		}).then(response => dispatch(receiveMeterBarReadings(meterIDs, timeInterval, compareDuration, response.data)));
	};
}

function fetchGroupCompareReadings(groupIDs, timeInterval) {
	return (dispatch, getState) => {
		const compareDuration = getState().graph.compareDuration;
		dispatch(requestGroupBarReadings(groupIDs, timeInterval, compareDuration));
		// API expects a comma-separated string of IDs
		const stringifiedIDs = groupIDs.join(',');

		return axios.get(`/api/readings/bar/groups/${stringifiedIDs}`, {
			params: { timeInterval: timeInterval, barDuration: compareDuration.toISOString() }
		}).then(response => dispatch(receiveGroupBarReadings(groupIDs, timeInterval, compareDuration, response.data)));
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
		const futures = [];

		// Determine which meters are missing data for this time interval
		const meterIDsToFetchForBar = state.graph.selectedMeters.filter(
			id => shouldFetchMeterBarReadings(state, id, timeInterval, state.graph.barDuration)
		);
		// Fetch data for any missing meters
		if (meterIDsToFetchForBar.length > 0) {
			futures.push(dispatch(fetchMeterBarReadings(meterIDsToFetchForBar, timeInterval)));
		}

		// Determine which groups are missing data for this time interval
		const groupIDsToFetchForBar = state.graph.selectedGroups.filter(
			id => shouldFetchGroupBarReadings(state, id, timeInterval, state.graph.barDuration)
		);
		// Fetch data for any missing groups
		if (groupIDsToFetchForBar.length > 0) {
			futures.push(dispatch(fetchGroupBarReadings(groupIDsToFetchForBar, timeInterval)));
		}
		return Promise.all(futures);
	};
}

export function fetchNeededCompareReadings(timeInterval) {
	return (dispatch, getState) => {
		const state = getState();
		const futures = [];

		// Determine which meters are missing data for this time interval
		const meterIDsToFetchForCompare = state.graph.selectedMeters.filter(
			id => shouldFetchMeterBarReadings(state, id, timeInterval, state.graph.compareDuration)
		);
		// Fetch data for any missing meters
		if (meterIDsToFetchForCompare.length > 0) {
			futures.push(dispatch(fetchCompareReadings(meterIDsToFetchForCompare, timeInterval)));
		}

		// Determine which groups are missing data for this time interval
		const groupIDsToFetchForCompare = state.graph.selectedGroups.filter(
			id => shouldFetchGroupBarReadings(state, id, timeInterval, state.graph.compareDuration)
		);
		// Fetch data for any missing groups
		if (groupIDsToFetchForCompare.length > 0) {
			futures.push(dispatch(fetchGroupCompareReadings(groupIDsToFetchForCompare, timeInterval)));
		}
		return Promise.all(futures);
	};
}
