
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import _ from 'lodash';
import * as readingsActions from '../actions/lineReadings';
import { DATA_TYPE_METER, DATA_TYPE_GROUP } from '../utils/Datasources';

/**
 * @typedef {Object} State~BarReadings
 * @property {Object<number, Object>} byMeterID
 */

/**
 * @type {State~Readings}
 */
const defaultState = {
	byMeterID: {},
	byGroupID: {}
};

/**
 * @param {State~Readings} state
 * @param action
 * @return {State~Readings}
 */
export default function readings(state = defaultState, action) {
	switch (action.type) {
		case readingsActions.REQUEST_LINE_READINGS: {
			const timeInterval = action.timeInterval;
			const newState = {
				...state,
				byMeterID: {
					...state.byMeterID
				},
				byGroupID: {
					...state.byGroupID
				}
			};
			if (action.dstype === DATA_TYPE_METER) {
				for (const meterID of action.dsIDs) {
					if (newState.byMeterID[meterID] === undefined) {
						newState.byMeterID[meterID] = {};
					} else if (newState.byMeterID[meterID][timeInterval] === undefined) {
						newState.byMeterID[meterID][timeInterval] = { isFetching: true };
					} else {
						newState.byMeterID[meterID][timeInterval] = { ...newState.byMeterID[meterID][timeInterval], isFetching: true };
					}
				}
			} else if (action.dstype === DATA_TYPE_GROUP) {
				for (const groupID of action.dsIDs) {
					if (newState.byGroupID[groupID] === undefined) {
						newState.byGroupID[groupID] = {};
					} else if (newState.byGroupID[groupID][timeInterval] === undefined) {
						newState.byGroupID[groupID][timeInterval] = { isFetching: true };
					} else {
						newState.byGroupID[groupID][timeInterval] = { ...newState.byGroupID[groupID][timeInterval], isFetching: true };
					}
				}
			}
			return newState;
		}
		case readingsActions.RECEIVE_LINE_READINGS: {
			const timeInterval = action.timeInterval;
			const newState = {
				...state,
				byMeterID: {
					...state.byMeterID,
				},
				byGroupID: {
					...state.byGroupID
				}
			};

			if (action.dstype === DATA_TYPE_METER) {
				for (const meterID of action.dsIDs) {
					const readingsForMeter = action.readings[meterID];
					// Sort by timestamp
					const sortedReadingsForMeter = _.sortBy(readingsForMeter, reading => reading[0]);
					newState.byMeterID[meterID][timeInterval] = { isFetching: false, readings: sortedReadingsForMeter };
				}
			} else if (action.dstype === DATA_TYPE_GROUP) {
				for (const groupID of action.dsIDs) {
					const readingsForGroup = action.readings[groupID];
					// Sort by timestamp
					const sortedReadingsForGroup = _.sortBy(readingsForGroup, reading => reading[0]);
					newState.byGroupID[groupID][timeInterval] = { isFetching: false, readings: sortedReadingsForGroup };
				}
			}

			return newState;
		}
		default:
			return state;
	}
}
