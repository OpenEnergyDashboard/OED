/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Dispatch, GetState, Thunk} from "../types/redux/actions";
import {TimeInterval} from "../../../common/TimeInterval";
import * as moment from 'moment';
import {
	receiveGroupBarReadings,
	receiveMeterBarReadings,
	requestGroupBarReadings,
	requestMeterBarReadings,
	shouldFetchGroupBarReadings,
	shouldFetchMeterBarReadings
} from "./barReadings";
import {compressedReadingsApi} from "../utils/api";

export function fetchNeededMapReadings(timeInterval: TimeInterval): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		const state = getState();
		const promises: Array<Promise<any>> = [];
		const mapDuration = (timeInterval.equals(TimeInterval.unbounded()))? moment.duration(4, 'weeks')
			: moment.duration(timeInterval.duration('days'), 'days');
		console.log(mapDuration);
		// Determine which meters are missing data for this time interval
		const meterIDsToFetchForMap = state.graph.selectedMeters.filter(
			id => shouldFetchMeterBarReadings(state, id, timeInterval, mapDuration)
		);
		// Fetch data for any missing meters
		if (meterIDsToFetchForMap.length > 0) {
			promises.push(dispatch(fetchMeterMapReadings(meterIDsToFetchForMap, timeInterval, mapDuration)));
		}

		// Determine which groups are missing data for this time interval
		const groupIDsToFetchForMap = state.graph.selectedGroups.filter(
			id => shouldFetchGroupBarReadings(state, id, timeInterval, mapDuration)
		);
		// Fetch data for any missing groups
		if (groupIDsToFetchForMap.length > 0) {
			promises.push(dispatch(fetchGroupMapReadings(groupIDsToFetchForMap, timeInterval, mapDuration)));
		}
		return Promise.all(promises);
	};
}

/**
 * Fetch the data for the given meters over the given interval. Fully manages the Redux lifecycle.
 * Reads bar duration from the state.
 * @param {[number]} meterIDs The IDs of the meters whose data should be fetched
 * @param {TimeInterval} timeInterval The time interval over which data should be fetched
 * @param {moment.Duration} duration The length of time covered in this timeInterval
 */
function fetchMeterMapReadings(meterIDs: number[], timeInterval: TimeInterval, duration: moment.Duration): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(requestMeterBarReadings(meterIDs, timeInterval, duration));
		const readings = await compressedReadingsApi.meterBarReadings(meterIDs, timeInterval, Math.round(duration.asDays()));
		dispatch(receiveMeterBarReadings(meterIDs, timeInterval, duration, readings));
	};
}

/**
 * Fetch the data for the given groups over the given interval. Fully manages the Redux lifecycle.
 * Reads bar duration from the state.
 * @param {[number]} groupIDs The IDs of the groups whose data should be fetched
 * @param {TimeInterval} timeInterval The time interval over which data should be fetched
 * @param {moment.Duration} duration Specify the duration to be the range of timeInterval
 * @param {moment.Duration} duration The length of time covered in this timeInterval
 */
function fetchGroupMapReadings(groupIDs: number[], timeInterval: TimeInterval, duration: moment.Duration): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(requestGroupBarReadings(groupIDs, timeInterval, duration));
		const readings = await compressedReadingsApi.groupBarReadings(groupIDs, timeInterval, Math.round(duration.asDays()));
		dispatch(receiveGroupBarReadings(groupIDs, timeInterval, duration, readings));
	};
}

