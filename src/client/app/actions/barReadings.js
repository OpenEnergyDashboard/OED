/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import _ from 'lodash';
import axios from 'axios';
import { DATA_TYPE_GROUP, DATA_TYPE_METER, metersFilterReduce, groupsFilterReduce } from '../utils/Datasources';

export const REQUEST_BAR_READINGS = 'REQUEST_BAR_READINGS';
export const RECEIVE_BAR_READINGS = 'RECEIVE_BAR_READINGS';

/**
 * @param {State} state
 * @param {{type: String, id: number}} datasource
 * @param {TimeInterval} timeInterval
 * @param {Moment.Duration} barDuration
 */
function shouldFetchBarReadings(state, datasource, timeInterval, barDuration) {
	// Figure out whether to look in the groups or meters data array
	let datasourceReadingsArray = [];
	if (datasource.type === DATA_TYPE_METER) {
		datasourceReadingsArray = state.readings.bar.byMeterID;
	} else if (datasource.type === DATA_TYPE_GROUP) {
		datasourceReadingsArray = state.readings.bar.byGroupID;
	} else {
		console.error('Cannot perform shouldFetchBarReadings for datasource type ', datasource.type);
		return false;
	}

	const readingsForDatasource = datasourceReadingsArray[datasource.id];
	// Check that the reading is there
	if (readingsForDatasource === undefined) {
		return true;
	}
	if (readingsForDatasource[timeInterval] === undefined) {
		return true;
	}
	if (readingsForDatasource[timeInterval][barDuration] === undefined) {
		return true;
	}
	// Look up the data for the given bar duration and time
	const readingsForTimeIntervalAndDuration = datasourceReadingsArray[datasource.id][timeInterval][barDuration];
	// If there's no data for the time interval, and a request for that data isn't in progress,
	// return true so a request for that data can be initiated.
	return readingsForTimeIntervalAndDuration === undefined && !readingsForTimeIntervalAndDuration.isFetching;
}

function requestBarReadings(datasourceIDs, timeInterval, barDuration) {
	return { type: REQUEST_BAR_READINGS, datasourceIDs, timeInterval, barDuration };
}

function receiveBarReadings(datasourceIDs, timeInterval, barDuration, readings) {
	return { type: RECEIVE_BAR_READINGS, datasourceIDs, timeInterval, barDuration, readings };
}

function fetchBarReadings(datasourceIDs, timeInterval) {
	return (dispatch, getState) => {
		const barDuration = getState().graph.barDuration;
		dispatch(requestBarReadings(datasourceIDs, timeInterval, barDuration));

		// Extract seperate lists of meters and groups to be fetched.
		// These lists still have type information.
		const meterIDs = _.reduce(datasourceIDs, (t, i) => metersFilterReduce(t, i, true), []);
		const groupIDs = _.reduce(datasourceIDs, (t, i) => groupsFilterReduce(t, i, true), []);

		const promises = [];
		if (groupIDs.length > 0) {
			// API wants a string of comma seperated numerical IDs.
			const stringifiedGroupIDs = groupIDs.map(group => group.id).join(',');
			console.warn(`Unimplemented request issued for group bar readings! Groups: ${stringifiedGroupIDs}`);
			// TODO: This is not the right URL!
			const groupsDataPromise = axios.get(`/api/readings/bar/${stringifiedGroupIDs}`, {
				params: { timeInterval: timeInterval.toString(), barDuration: barDuration.toISOString() }
			}).then(response => dispatch(receiveBarReadings(groupIDs, timeInterval, barDuration, response.data)));
			promises.push(groupsDataPromise);
		}
		if (meterIDs.length > 0) {
			// API wants a string of comma seperated numerical IDs.
			const stringifiedMeterIDs = meterIDs.map(meter => meter.id).join(',');
			const metersDataPromise = axios.get(`/api/readings/bar/${stringifiedMeterIDs}`, {
				params: { timeInterval: timeInterval.toString(), barDuration: barDuration.toISOString() }
			}).then(response => {
				console.log(response.data);
				dispatch(receiveBarReadings(meterIDs, timeInterval, barDuration, response.data));
			});
			promises.push(metersDataPromise);
		}
		return Promise.all(promises);
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
		const datasourceIDsToFetchForBar = state.graph.selectedDatasources.filter(
			id => shouldFetchBarReadings(state, id, timeInterval, state.graph.barDuration)
		);
		if (datasourceIDsToFetchForBar.length > 0) {
			return dispatch(fetchBarReadings(datasourceIDsToFetchForBar, timeInterval));
		}
		return Promise.resolve();
	};
}
