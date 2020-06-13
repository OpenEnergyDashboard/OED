/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {ActionType, Thunk} from '../types/redux/actions';
import * as t from '../types/redux/map';
import {CalibrationModeTypes} from '../types/redux/map';
import calibrate, {CalibratedPoint, CartesianPoint, Dimensions, GPSPoint} from "../utils/calibration";
import {State} from "../types/redux/state";

export function updateMapSource(imageSource: HTMLImageElement): Thunk {
	return dispatch => {
		dispatch(uploadMapSource(imageSource));
		return Promise.resolve();
	};
}

export function uploadMapSource(image: HTMLImageElement): t.UpdateMapSourceAction {
	return { type: ActionType.UpdateMapSource, image };
}

export function updateMapMode(nextMode: CalibrationModeTypes): t.ChangeMapModeAction {
	return { type: ActionType.UpdateMapMode, nextMode };
}

export function updateCurrentCartesian(currentCartesian: CartesianPoint): t.UpdateCurrentCartesianAction {
	return { type: ActionType.UpdateCurrentCartesian, currentCartesian };
}

export function offerCurrentGPS(currentGPS: GPSPoint): Thunk {
	return (dispatch, getState) => {
		if (getState().map.calibration.currentPoint.hasCartesian()) {
			const point = getState().map.calibration.currentPoint.clone()
			point.setGPS(currentGPS);
			dispatch(updateCalibrationSet(point));
			// Nesting dispatches to preserve that updateCalibrationSet() is called before calibration
			dispatch(dispatch2 => {
				if (isReadyForCalibration(getState().map.calibration.calibrationSet)) {
					const result = prepareDataToCalibration(getState());
					dispatch2(updateResult(result));
				}
				dispatch2(resetCurrentPoint());
			})
		}
		return Promise.resolve();
	}
}

function updateCalibrationSet(calibratedPoint: CalibratedPoint): t.AppendCalibrationSetAction {
	return { type: ActionType.AppendCalibrationSet, calibratedPoint};
}

function isReadyForCalibration(calibrationSet: any[]): boolean {
	const calibrationThreshold = 3;
	return calibrationSet.length >= calibrationThreshold;
}

function updateCurrentGPS(currentGPS: GPSPoint): t.UpdateCurrentGPSAction {
	return { type: ActionType.UpdateCurrentGPS, currentGPS};
}

/**
 *  prepare data to required formats to pass it to function calculating mapScales
 */
function prepareDataToCalibration(state: State): string {
	const imageDimensions: Dimensions = {
		width: state.map.calibration.image.width,
		height: state.map.calibration.image.height
	};
	const result = calibrate(
		state.map.calibration.calibrationSet,
		imageDimensions);
	return result.toString();
}

function updateResult(result: string): t.UpdateCalibrationResultAction {
	return { type: ActionType.UpdateCalibrationResults, result}
}

export function resetCurrentPoint(): t.ResetCurrentPointAction {
	return { type: ActionType.ResetCurrentPoint } ;
}

