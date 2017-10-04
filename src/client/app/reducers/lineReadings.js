
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as readingsActions from '../actions/lineReadings';
import { DATA_TYPE_GROUP, DATA_TYPE_METER } from '../utils/Datasources';

/**
 * @typedef {Object} State~BarReadings
 * @property {Object<number, Object>} byMeterID
 */

/**
 * @type {State~Readings}
 */
const defaultState = {
	byMeterID: {},
	byGroupID: {},
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
			for (const datasourceID of action.datasourceIDs) {
				// For each datasource, make sure that all the typing info is stubbed out
				// e.g. that arrays are created and such.

				if (datasourceID.type === DATA_TYPE_METER) {
					const meterID = datasourceID.id;
					if (newState.byMeterID[meterID] === undefined) {
						newState.byMeterID[meterID] = {};
					} else if (newState.byMeterID[meterID][timeInterval] === undefined) {
						newState.byMeterID[meterID][timeInterval] = { isFetching: true };
					} else {
						newState.byMeterID[meterID][timeInterval] = { ...newState.byMeterID[meterID][timeInterval], isFetching: true };
					}
				} else if (datasourceID.type === DATA_TYPE_GROUP) {
					const groupID = datasourceID.id;
					if (newState.byGroupID[groupID] === undefined) {
						newState.byGroupID[groupID] = {};
					} else if (newState.byGroupID[groupID][timeInterval] === undefined) {
						newState.byGroupID[groupID][timeInterval] = { isFetching: true };
					} else {
						newState.byGroup[groupID][timeInterval] = { ...newState.byGroup[groupID][timeInterval], isFetching: true };
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
					...state.byMeterID
				},
				byGroupID: {
					...state.byGroupID
				}
			};
			for (const datasourceID of action.datasourceIDs) {
				const readingsFromAction = action.readings[datasourceID.id];
				if (datasourceID.type === DATA_TYPE_METER) {
					newState.byMeterID[datasourceID.id][timeInterval] = { isFetching: false, readings: readingsFromAction };
				} else if (datasourceID.type === DATA_TYPE_GROUP) {
					newState.byGroupID[datasourceID.id][timeInterval] = { isFetching: false, readings: readingsFromAction };
				}
			}
			return newState;
		}
		default:
			return state;
	}
}
