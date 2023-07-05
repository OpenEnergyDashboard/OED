/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ThreeDReadingsAction, ThreeDReadingsState } from '../types/redux/threeDReadings';
import { ActionType } from '../types/redux/actions';

const defaultState: ThreeDReadingsState = {
	byMeterID: {},
	isFetching: false,
	metersFetching: false
};

export default function readings(state = defaultState, action: ThreeDReadingsAction) {
	switch (action.type) {
		case ActionType.RequestMeterThreeDReadings: {
			const timeInterval = action.timeInterval.toString();
			const unitID = action.unitID;
			const newState = {
				...state,
				isFetching: true
			};

			const meterID = action.meterID;
			// Create meter wrapper if needed
			if (newState.byMeterID[meterID] === undefined)
				newState.byMeterID[meterID] = {};

			if (newState.byMeterID[meterID][timeInterval] === undefined)
				newState.byMeterID[meterID][timeInterval] = {};

			// Preserve existing data if exists
			if (newState.byMeterID[meterID][timeInterval][unitID] !== undefined)
				newState.byMeterID[meterID][timeInterval][unitID] = { ...newState.byMeterID[meterID][timeInterval][unitID], isFetching: true };
			else
				newState.byMeterID[meterID][timeInterval][unitID] = { isFetching: true };

			return newState;
		}
		case ActionType.ReceiveMeterThreeDReadings: {
			const timeInterval = action.timeInterval.toString();
			const unitID = action.unitID;
			const newState: ThreeDReadingsState = {
				...state,
				isFetching: false
			};

			const meterID = action.meterID;
			const readingsForMeter = action.readings;
			newState.byMeterID[meterID][timeInterval][unitID] = { readings: readingsForMeter, isFetching: false };
			return newState;
		}

		default:
			return state;
	}
}
