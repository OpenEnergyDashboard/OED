/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TimeInterval } from '../../../common/TimeInterval';
import { ActionType, Thunk, Dispatch, GetState } from '../types/redux/actions';
import * as t from '../types/redux/threeDReadings';
import { readingsApi } from '../utils/api';
import { ThreeDReading } from '../types/readings';

/**
 * @param meterID the IDs of the meters to get readings
 * @param timeInterval the interval over which to check
 * @param unitID the ID of the unit for which to check
 */
function requestMeterThreeDReadings(meterID: number, timeInterval: TimeInterval, unitID: number): t.RequestMeterThreeDReadingsAction {
	return { type: ActionType.RequestMeterThreeDReadings, meterID, timeInterval, unitID };
}

/**
 * @param meterID the IDs of the meters to get readings
 * @param timeInterval the interval over which to check
 * @param unitID the ID of the unit for which to check
 * @param readings the readings for the given meters
 */
function receiveMeterThreeDReadings(
	meterID: number, timeInterval: TimeInterval, unitID: number, readings: ThreeDReading): t.ReceiveMeterThreeDReadingsAction {
	return { type: ActionType.ReceiveMeterThreeDReadings, meterID, timeInterval, unitID, readings };
}

/**
 * @param meterID the IDs of the meters to get readings
 * @param timeInterval the interval over which to check
 * @param unitID the ID of the unit for which to check
 */
function fetchMeterThreeDReadings(meterID: number, timeInterval: TimeInterval, unitID: number): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(requestMeterThreeDReadings(meterID, timeInterval, unitID));
		const meterThreeDReadings = await readingsApi.meterThreeDReadings(meterID, timeInterval, unitID);
		dispatch(receiveMeterThreeDReadings(meterID, timeInterval, unitID, meterThreeDReadings));
	};
}