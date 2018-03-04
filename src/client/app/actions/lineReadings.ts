/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import axios from 'axios';
import { TimeInterval } from '../../../common/TimeInterval';
import { LineReadings } from '../types/readings';
import {ActionType, Thunk, Dispatch, GetState} from '../types/redux/actions';
import { State } from '../types/redux/state';
import * as t from '../types/redux/lineReadings';

function shouldFetchGroupLineReadings(state: State, groupID: number, timeInterval: TimeInterval): boolean {
	const timeIntervalIndex = timeInterval.toString();
	const readingsForID = state.readings.line.byGroupID[groupID];
	if (readingsForID === undefined) {
		return true;
	}

	const readingsForTimeInterval = readingsForID[timeIntervalIndex];
	if (readingsForID[timeIntervalIndex] === undefined) {
		return true;
	}

	return !readingsForTimeInterval.isFetching;
}

function shouldFetchMeterLineReadings(state: State, meterID: number, timeInterval: TimeInterval): boolean {
	const timeIntervalIndex = timeInterval.toString();
	const readingsForID = state.readings.line.byMeterID[meterID];
	if (readingsForID === undefined) {
		return true;
	}

	const readingsForTimeInterval = readingsForID[timeIntervalIndex];
	if (readingsForID[timeIntervalIndex] === undefined) {
		return true;
	}

	return !readingsForTimeInterval.isFetching;
}

function requestMeterLineReadings(meterIDs: number[], timeInterval: TimeInterval): t.RequestMeterLineReadingsAction {
	return { type: ActionType.RequestMeterLineReadings, meterIDs, timeInterval };
}

function receiveMeterLineReadings(meterIDs: number[], timeInterval: TimeInterval, readings: LineReadings): t.ReceiveMeterLineReadingsAction {
	return { type: ActionType.ReceiveMeterLineReadings, meterIDs, timeInterval, readings };
}

function requestGroupLineReadings(groupIDs: number[], timeInterval: TimeInterval): t.RequestGroupLineReadingsAction {
	return { type: ActionType.RequestGroupLineReadings, groupIDs, timeInterval };
}


function receiveGroupLineReadings(groupIDs: number[], timeInterval: TimeInterval, readings: LineReadings): t.ReceiveGroupLineReadingsAction {
	return { type: ActionType.ReceiveGroupLineReadings, groupIDs, timeInterval, readings };
}

/**
 * Fetch the data for the given meters over the given interval. Fully manages the Redux lifecycle.
 */
function fetchMeterLineReadings(meterIDs: number[], timeInterval: TimeInterval): Thunk {
	return dispatch => {
		dispatch(requestMeterLineReadings(meterIDs, timeInterval));
		// The api expects the meter IDs to be a comma-separated list.
		const stringifiedIDs = meterIDs.join(',');
		return axios.get(`/api/readings/line/meters/${stringifiedIDs}`, {
			params: { timeInterval: timeInterval.toString() }
		}).then(response => dispatch(receiveMeterLineReadings(meterIDs, timeInterval, response.data)));
	};
}

/**
 * Fetch the data for the given groups over the given interval. Fully manages the Redux lifecycle.
 */
function fetchGroupLineReadings(groupIDs: number[], timeInterval: TimeInterval): Thunk {
	return (dispatch: Dispatch) => {
		dispatch(requestGroupLineReadings(groupIDs, timeInterval));
		// The api expects the group IDs to be a comma-separated list.
		const stringifiedIDs = groupIDs.join(',');
		return axios.get(`/api/readings/line/groups/${stringifiedIDs}`, {
			params: { timeInterval: timeInterval.toString() }
		}).then(response => dispatch(receiveGroupLineReadings(groupIDs, timeInterval, response.data)));
	};
}

/**
 * Fetches readings for the line chart of all selected meters and groups, if needed.
 */
export function fetchNeededLineReadings(timeInterval: TimeInterval): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		const state = getState();
		const promises: Array<Promise<any>> = [];

		// Determine which meters are missing data for this time interval
		const meterIDsToFetchForLine = state.graph.selectedMeters.filter(
			id => shouldFetchMeterLineReadings(state, id, timeInterval)
		);
		if (meterIDsToFetchForLine.length > 0) {
			promises.push(dispatch(fetchMeterLineReadings(meterIDsToFetchForLine, timeInterval)));
		}

		// Determine which groups are missing data for this time interval
		const groupIDsToFetchForLine = state.graph.selectedGroups.filter(
			id => shouldFetchGroupLineReadings(state, id, timeInterval)
		);
		if (groupIDsToFetchForLine.length > 0) {
			promises.push(dispatch(fetchGroupLineReadings(groupIDsToFetchForLine, timeInterval)));
		}

		return Promise.all(promises);
	};
}
