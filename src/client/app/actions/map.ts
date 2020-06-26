/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {ActionType, Dispatch, GetState, Thunk} from '../types/redux/actions';
import * as t from '../types/redux/map';
import {CalibrationModeTypes, MapData} from '../types/redux/map';
import calibrate, {CalibratedPoint, CartesianPoint, Dimensions, GPSPoint} from "../utils/calibration";
import {State} from "../types/redux/state";
import {mapsApi} from "../utils/api";

export function displayLoading(): t.DisplayMapLoadingAction {
	return { type: ActionType.DisplayMapLoading };
}

function requestSelectedMap() {
	return { type: ActionType.RequestSelectedMap };
}

function receiveSelectedMap(map: MapData) {
	return { type: ActionType.ReceiveSelectedMap, map};
}

export function fetchSelectedMap(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		dispatch(requestSelectedMap());
		const map: MapData = await mapsApi.getMapById(9);
		// @ts-ignore
		// console.log(map.origin.x);
		// map.origin is still a Point() type;
		// TODO: write function to set the origin with type of CalibratedPoint with data from Point() origin
		map.origin = new CalibratedPoint();
		await dispatch(receiveSelectedMap(map));
		// console.log(`${getState().map.calibration.mode},fetched source: ${getState().map.calibration.image.src}`);

		if (getState().map.calibration.image.src) {
			dispatch((dispatch2) => {
				dispatch2(updateMapMode(CalibrationModeTypes.calibrate));
			});
		}
	};
}

export function updateMapSource(imageSource: HTMLImageElement): Thunk {
	return async dispatch => {
		dispatch((dispatch2) => {
			const newMap: MapData = {
				name: "test1",
				mapSource: imageSource.src,
			};
			dispatch2(uploadMapSource(imageSource));
			console.log(imageSource.src);
			mapsApi.create(newMap); //TODO: remove after test
		})
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
			});
		}
		return Promise.resolve();
	}
}

function updateCalibrationSet(calibratedPoint: CalibratedPoint): t.AppendCalibrationSetAction {
	return { type: ActionType.AppendCalibrationSet, calibratedPoint};
}

/**
 * use a default number as the threshold in determining if it's safe to call the calibration function
 * @param calibrationSet an any array used as dataset
 */
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
	return result;
}

function updateResult(result: string): t.UpdateCalibrationResultAction {
	return { type: ActionType.UpdateCalibrationResults, result}
}

export function resetCurrentPoint(): t.ResetCurrentPointAction {
	return { type: ActionType.ResetCurrentPoint } ;
}
