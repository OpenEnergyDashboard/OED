/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {CalibrationModeTypes, MapMetadata, MapsAction, MapState} from '../types/redux/map';
import {ActionType} from '../types/redux/actions';
import * as _ from "lodash";

const defaultState: MapState = {
	isLoading: false,
	byMapID: {},
	selectedMap: 0,
	editedMaps: {},
	submitting: [],
	// name: 'default',
	// isDisplayable: false,
	// note: 'left as blank',
	// filename: 'image',
	// lastModified: '',
	// image: new Image(),
	// currentPoint: {gps: {longitude: -1, latitude: -1}, cartesian: {x: -1, y: -1}},
	// calibrationSet: [],
	// calibrationResult: {origin: {longitude: 0, latitude: 0}, opposite: {longitude: 0, latitude: 0}},
};

export default function maps(state = defaultState, action: MapsAction) {
	let submitting;
	let editedMaps;
	switch (action.type) {
		case ActionType.UpdateMapMode:
			return {
				...state,
				calibrationMode: action.nextMode
			};
		case ActionType.UpdateSelectedMap:
			return {
				...state,
				selectedMap: action.mapID,
			}
		case ActionType.RequestMapsDetails:
			return {
				...state,
				isLoading: true
			};
		case ActionType.ReceiveMapsDetails:
			const data: MapMetadata[] = action.data.map(mapData => {
				// parse JSON format to MapMetadata object
				const parsedMap = JSON.parse(JSON.stringify(mapData));
				let image = new Image();
				image.src = parsedMap.mapSource;
				parsedMap.image = image;
				return parsedMap;
			});
			return {
				...state,
				isLoading: false,
				byMapID: _.keyBy(data, map => map.id)
			};
		case ActionType.RequestSelectedMap:
			return {
				...state,
				isLoading: true
			};
		case ActionType.ReceiveSelectedMap:
			const receivedImage = new Image();
			receivedImage.src = action.map.mapSource;
			return {
				...state,
				isLoading: false,
				name: action.map.name,
				note: action.map.note,
				image: receivedImage,
				filename: action.map.filename,
				calibrationResult: {
					origin: action.map.origin,
					opposite: action.map.opposite,
				}
			}
		case ActionType.UpdateMapSource:
			const newImage = new Image();
			newImage.src = action.data.mapSource;
			return {
				...state,
				name: action.data.name,
				note: action.data.note, //should notes be updated only after upload is complete?
				image: newImage,
				filename: action.data.filename,
				isLoading: false
			};
		case ActionType.EditMapDetails:
			editedMaps = state.editedMaps;
			editedMaps[action.map.id] = action.map;
			return {
				...state,
				editedMaps,
			};
		case ActionType.SubmitEditedMap:
			submitting = state.submitting;
			submitting.push(action.mapID);
			return {
				...state,
				submitting
			};
		case ActionType.ConfirmEditedMap:
			submitting = state.submitting;
			submitting.splice(submitting.indexOf(action.mapID));

			const byMapID = state.byMapID;
			editedMaps = state.editedMaps;
			byMapID[action.mapID] = editedMaps[action.mapID];

			delete editedMaps[action.mapID];
			return {
				...state,
				submitting,
				editedMaps,
				byMapID
			};
		case ActionType.UpdateCurrentCartesian:
			return {
				...state,
				currentPoint: {
					...state.currentPoint,
					cartesian: action.currentCartesian,
				},
			};
		case ActionType.UpdateCurrentGPS:
			return {
				...state,
				currentPoint: {
					...state.currentPoint,
					gps: action.currentGPS,
				}
			};
		case ActionType.ResetCurrentPoint:
			return {
				...state,
				currentPoint: {gps: {longitude: -1, latitude: -1}, cartesian: {x: -1, y: -1}},
			};
		case ActionType.AppendCalibrationSet:
			return {
				...state,
				calibrationSet: [
					...state.calibrationSet.slice(0),
					action.calibratedPoint,
				],
			};
		case ActionType.UpdateCalibrationResults:
			return {
				...state,
				calibrationResult: action.result
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
