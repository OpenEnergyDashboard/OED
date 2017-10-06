
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as readingsActions from '../actions/barReadings';
import { DATA_TYPE_METER, DATA_TYPE_GROUP } from '../utils/Datasources';

/**
 * @typedef {Object} State~BarReadings
 * @property {Object<number, Object>} byMeterID
 */

/**
 * @type {State~BarReadings}
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
		case readingsActions.REQUEST_BAR_READINGS: {
			const timeInterval = action.timeInterval;
			const barDuration = action.barDuration;
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
					}
					if (newState.byMeterID[meterID][timeInterval] === undefined) {
						newState.byMeterID[meterID][timeInterval] = {};
					} else if (newState.byMeterID[meterID][timeInterval][barDuration] === undefined) {
						newState.byMeterID[meterID][timeInterval][barDuration] = { isFetching: true };
					} else {
						newState.byMeterID[meterID][timeInterval][barDuration] = { ...newState.byMeterID[meterID][timeInterval][barDuration], isFetching: true };
					}
				}
			} else if (action.dstype === DATA_TYPE_GROUP) {
				for (const groupID of action.dsIDs) {
					if (newState.byGroupID[groupID] === undefined) {
						newState.byGroupID[groupID] = {};
					}
					if (newState.byGroupID[groupID][timeInterval] === undefined) {
						newState.byGroupID[groupID][timeInterval] = {};
					} else if (newState.byGroupID[groupID][timeInterval][barDuration] === undefined) {
						newState.byGroupID[groupID][timeInterval][barDuration] = { isFetching: true };
					} else {
						newState.byGroupID[groupID][timeInterval][barDuration] = { ...newState.byGroupID[groupID][timeInterval][barDuration], isFetching: true };
					}
				}
			}

			return newState;
		}
		case readingsActions.RECEIVE_BAR_READINGS: {
			const timeInterval = action.timeInterval;
			const barDuration = action.barDuration;
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
					const readingsForMeter = action.readings[meterID];
					newState.byMeterID[meterID][timeInterval][barDuration] = { isFetching: false, readings: readingsForMeter };
				}
			} else if (action.dstype === DATA_TYPE_GROUP) {
				for (const groupID of action.dsIDs) {
					const readingsForGroup = action.readings[groupID];
					newState.byGroupID[groupID][timeInterval][barDuration] = { isFetching: false, readings: readingsForGroup };
				}
			}
			return newState;
		}
		default:
			return state;
	}
}
