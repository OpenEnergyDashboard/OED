/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {ActionType, Thunk} from '../types/redux/actions';
import * as t from '../types/redux/map';
import {CalibrationModeTypes} from '../types/redux/map';
import {CalibratedPoint, CartesianPoint, GPSPoint} from "../utils/calibration";

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
			dispatch(resetCurrentPoint());
		}
		return Promise.resolve();
	}
}

function updateCalibrationSet(calibratedPoint: CalibratedPoint): t.AppendCalibrationSetAction {
	return { type: ActionType.AppendCalibrationSet, calibratedPoint};
}

function updateCurrentGPS(currentGPS: GPSPoint): t.UpdateCurrentGPSAction {
	return { type: ActionType.UpdateCurrentGPS, currentGPS};
}

export function resetCurrentPoint(): t.ResetCurrentPointAction {
	return { type: ActionType.ResetCurrentPoint } ;
}

