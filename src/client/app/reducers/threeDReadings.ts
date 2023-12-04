/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ThreeDReadingsAction, ThreeDReadingsState } from '../types/redux/threeDReadings';
import { ActionType } from '../types/redux/actions';

const defaultState: ThreeDReadingsState = {
	byMeterID: {},
	byGroupID: {},
	isFetching: false,
	metersFetching: false
};

export default function readings(state = defaultState, action: ThreeDReadingsAction) {
	switch (action.type) {
		case ActionType.RequestMeterThreeDReadings: {
			const meterID = action.meterID;
			const timeInterval = action.timeInterval.toString();
			const unitID = action.unitID;
			const readingInterval = action.readingInterval;
			const newState: ThreeDReadingsState = {
				...state,
				isFetching: true
			};

			// Create meter wrappers if needed
			if (newState.byMeterID[meterID] === undefined) {
				newState.byMeterID[meterID] = {};
			}

			if (newState.byMeterID[meterID][timeInterval] === undefined) {
				newState.byMeterID[meterID][timeInterval] = {};
			}

			// Preserve existing data if exists
			if (newState.byMeterID[meterID][timeInterval][unitID] === undefined) {
				newState.byMeterID[meterID][timeInterval][unitID] = {};
			}

			if (newState.byMeterID[meterID][timeInterval][unitID][readingInterval] !== undefined) {
				newState.byMeterID[meterID][timeInterval][unitID][readingInterval] = {
					...newState.byMeterID[meterID][timeInterval][unitID][readingInterval],
					isFetching: true
				};
			} else {
				newState.byMeterID[meterID][timeInterval][unitID][readingInterval] = { isFetching: true };
			}
			return newState;
		}
		case ActionType.ReceiveMeterThreeDReadings: {
			const meterID = action.meterID;
			const timeInterval = action.timeInterval.toString();
			const unitID = action.unitID;
			const readingInterval = action.readingInterval;
			const newState: ThreeDReadingsState = {
				...state,
				isFetching: false
			};

			const readingsForMeter = action.readings;
			newState.byMeterID[meterID][timeInterval][unitID][readingInterval] = { readings: readingsForMeter, isFetching: false };
			return newState;
		}
		case ActionType.RequestGroupThreeDReadings: {
			const groupID = action.groupID;
			const timeInterval = action.timeInterval.toString();
			const unitID = action.unitID;
			const readingInterval = action.readingInterval;
			const newState: ThreeDReadingsState = {
				...state,
				isFetching: true
			};

			// Create group wrappers if needed
			if (newState.byGroupID[groupID] === undefined) {
				newState.byGroupID[groupID] = {};
			}

			if (newState.byGroupID[groupID][timeInterval] === undefined) {
				newState.byGroupID[groupID][timeInterval] = {};
			}

			// Preserve existing data if exists
			if (newState.byGroupID[groupID][timeInterval][unitID] === undefined) {
				newState.byGroupID[groupID][timeInterval][unitID] = {};
			}

			if (newState.byGroupID[groupID][timeInterval][unitID][readingInterval] !== undefined) {
				newState.byGroupID[groupID][timeInterval][unitID][readingInterval] = {
					...newState.byGroupID[groupID][timeInterval][unitID][readingInterval],
					isFetching: true
				};
			} else {
				newState.byGroupID[groupID][timeInterval][unitID][readingInterval] = { isFetching: true };
			}
			return newState;
		}
		case ActionType.ReceiveGroupThreeDReadings: {
			const groupID = action.groupID;
			const timeInterval = action.timeInterval.toString();
			const unitID = action.unitID;
			const readingInterval = action.readingInterval;
			const newState: ThreeDReadingsState = {
				...state,
				isFetching: false
			};

			const readingsForGroup = action.readings;
			newState.byGroupID[groupID][timeInterval][unitID][readingInterval] = { readings: readingsForGroup, isFetching: false };
			return newState;
		}

		default:
			return state;
	}
}
