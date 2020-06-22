/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {CalibrationModeTypes, MapCalibrationAction, MapCalibrationState} from '../types/redux/map';
import {ActionType} from '../types/redux/actions';
import {CalibratedPoint} from "../utils/calibration";

const defaultState: MapCalibrationState = {
	mode: CalibrationModeTypes.initiate,
	isLoading: false,
	image: new Image(),
	currentPoint: new CalibratedPoint,
	calibrationSet: [],
	result: '',
};

export default function mapCalibration(state = defaultState, action: MapCalibrationAction) {
	switch (action.type) {
		case ActionType.UpdateMapMode:
			return {
				...state,
				mode: action.nextMode
			};
		case ActionType.UpdateMapSource:
			return {
				...state,
				image: action.image,
				isLoading: false
			};
		case ActionType.UpdateCurrentCartesian:
			let changeCartesian = state.currentPoint.clone();
			changeCartesian.setCartesian(action.currentCartesian);
			return {
				...state,
				currentPoint: changeCartesian,
			};
		case ActionType.UpdateCurrentGPS:
			let changeGPS = state.currentPoint.clone();
			changeGPS.setGPS(action.currentGPS);
			return {
				...state,
				currentPoint: changeGPS
			};
		case ActionType.ResetCurrentPoint:
			return {
				...state,
				currentPoint: new CalibratedPoint()
			};
		case ActionType.AppendCalibrationSet:
			let calibrationSet = state.calibrationSet;
			calibrationSet.push(action.calibratedPoint);
			return {
				...state,
				calibrationSet: calibrationSet,
			};
		case ActionType.UpdateCalibrationResults:
			return {
				...state,
				result: action.result
			};
		case ActionType.DisplayMapLoading:
			return {
				...state,
				isLoading: true
			};
		default:
			return state;
	}
}
