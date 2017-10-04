/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import _ from 'lodash';
import axios from 'axios';
import { DATA_TYPE_GROUP, DATA_TYPE_METER, metersFilterReduce, groupsFilterReduce } from '../utils/Datasources';

export const REQUEST_LINE_READINGS = 'REQUEST_LINE_READINGS';
export const RECEIVE_LINE_READINGS = 'RECEIVE_LINE_READINGS';

/**
 * Returns true if there is missing line reading data to be fetched, and false otherwise.
 * @param {State} state
 * @param {{type: String, id: number}} datasource A datasource type and database ID uniquely identifying a datasource
 * @param {TimeInterval} timeInterval
 */
function shouldFetchLineReadings(state, datasource, timeInterval) {
	// Figure out whether to look in the groups or meters data array
	let datasourceReadingsArray = [];
	if (datasource.type === DATA_TYPE_METER) {
		datasourceReadingsArray = state.readings.line.byMeterID;
	} else if (datasource.type === DATA_TYPE_GROUP) {
		datasourceReadingsArray = state.readings.line.byGroupID;
	} else {
		console.error('Cannot perform shouldFetchLineReadings for datasource type ', datasource.type);
		return false;
	}

	// Look up the readings for the given datasource
	const readingsForDatasource = datasourceReadingsArray[datasource.id];
	// If there's missing data, it needs to be fetched.
	if (readingsForDatasource === undefined) {
		return true;
	}
	if (readingsForDatasource[timeInterval] === undefined) {
		return true;
	}
	// Look up the time interval in the existing data
	const readingsForTimeInterval = datasourceReadingsArray[datasource.id][timeInterval];
	// If there's no data for the time interval, and a request for that data isn't in progress,
	// return true so a request for that data can be initiated.
	return readingsForTimeInterval === undefined && !readingsForTimeInterval.isFetching;
}

function requestLineReadings(datasourceIDs, timeInterval) {
	return { type: REQUEST_LINE_READINGS, datasourceIDs, timeInterval };
}

function receiveLineReadings(datasourceIDs, timeInterval, readings) {
	return { type: RECEIVE_LINE_READINGS, datasourceIDs, timeInterval, readings };
}

function fetchLineReadings(datasourceIDs, timeInterval) {
	return dispatch => {
		dispatch(requestLineReadings(datasourceIDs, timeInterval));

		// Extract seperate lists of meters and groups to be fetched.
		// These lists still have type information.
		const meterIDs = _.reduce(datasourceIDs, (t, i) => metersFilterReduce(t, i, true), []);
		const groupIDs = _.reduce(datasourceIDs, (t, i) => groupsFilterReduce(t, i, true), []);

		const promises = [];
		if (groupIDs.length > 0) {
			// API wants a string of comma seperated numerical IDs.
			const stringifiedGroupIDs = groupIDs.map(group => group.id).join(',');
			console.warn(`Unimplemented request issued for group line readings! Groups: ${stringifiedGroupIDs}`);
			// TODO: This is not the right URL!
			const groupsDataPromise = axios.get(`/api/readings/line/${stringifiedGroupIDs}`, {
				params: { timeInterval: timeInterval.toString() }
			}).then(response => dispatch(receiveLineReadings(groupIDs, timeInterval, response.data)));
			promises.push(groupsDataPromise);
		}
		if (meterIDs.length > 0) {
			// API wants a string of comma seperated numerical IDs.
			const stringifiedMeterIDs = meterIDs.map(meter => meter.id).join(',');
			const metersDataPromise = axios.get(`/api/readings/line/${stringifiedMeterIDs}`, {
				params: { timeInterval: timeInterval.toString() }
			}).then(response => dispatch(receiveLineReadings(meterIDs, timeInterval, response.data)));
			promises.push(metersDataPromise);
		}
		return Promise.all(promises);
	};
}

/**
 * Fetches readings for the line chart of all selected datasourceIDs if they are not already fetched or being fetched
 * @param {TimeInterval} timeInterval The time interval to fetch readings for on the line chart
 * @return {*} An action to fetch the needed readings
 */
export function fetchNeededLineReadings(timeInterval) {
	return (dispatch, getState) => {
		const state = getState();
		// Determine the datasources that need data fetched
		const datasourceIDsToFetchForLine = state.graph.selectedDatasources.filter(
			id => shouldFetchLineReadings(state, id, timeInterval)
		);
		if (datasourceIDsToFetchForLine.length > 0) {
			return dispatch(fetchLineReadings(datasourceIDsToFetchForLine, timeInterval));
		}
		return Promise.resolve();
	};
}
