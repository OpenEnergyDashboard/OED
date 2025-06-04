/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MapMetadata, MapsAction, MapState } from '../../types/redux/map';
import { ActionType } from '../../types/redux/actions';
import { keyBy } from 'lodash';
import { CalibratedPoint } from '../../utils/calibration';
import { RootState } from '../../store';

const defaultState: MapState = {
	isLoading: false,
	byMapID: {},
	selectedMap: 0,
	calibratingMap: 0,
	editedMaps: {},
	submitting: [],
	newMapCounter: 0,
	calibrationSettings: { showGrid: false }
};

// eslint-disable-next-line jsdoc/require-jsdoc
export default function maps(state = defaultState, action: MapsAction) {
	let submitting;
	let editedMaps;
	let byMapID;
	const calibrated = state.calibratingMap;
	switch (action.type) {
		case ActionType.UpdateCalibrationMode:
			return {
				...state,
				editedMaps: {
					...state.editedMaps,
					[calibrated]: {
						...state.editedMaps[calibrated],
						calibrationMode: action.nextMode
					}
				}
			};
		case ActionType.UpdateSelectedMap:
			return {
				...state,
				selectedMap: action.mapID
			};
		case ActionType.RequestMapsDetails:
			return {
				...state,
				isLoading: true
			};
		case ActionType.ReceiveMapsDetails: {
			const data: MapMetadata[] = action.data.map(mapData => {
				// parse JSON format to MapMetadata object
				const parsedData = JSON.parse(JSON.stringify(mapData));
				parsedData.image = new Image();
				parsedData.image.src = parsedData.mapSource;
				return parsedData;
			});
			return {
				...state,
				isLoading: false,
				byMapID: keyBy(data, map => map.id)
			};
		}
		case ActionType.IncrementCounter: {
			const counter = state.newMapCounter;
			return {
				...state,
				newMapCounter: counter + 1
			};
		}
		case ActionType.SetCalibration:
			byMapID = state.byMapID;
			// if the map is freshly created, just add a new instance into editedMaps
			if (action.mapID < 0) {
				return {
					...state,
					calibratingMap: action.mapID,
					editedMaps: {
						...state.editedMaps,
						[action.mapID]: {
							id: action.mapID,
							calibrationMode: action.mode
						}
					}
				};
			} else if (state.editedMaps[action.mapID] === undefined) {
				return {
					...state,
					calibratingMap: action.mapID,
					editedMaps: {
						...state.editedMaps,
						[action.mapID]: {
							// copy map from byMapID to editedMaps if there is not already a dirty map(with unsaved changes) in editedMaps
							...state.byMapID[action.mapID],
							calibrationMode: action.mode
						}
					}
				};
			} else {
				return {
					...state,
					calibratingMap: action.mapID,
					editedMaps: {
						...state.editedMaps,
						[action.mapID]: {
							...state.editedMaps[action.mapID],
							calibrationMode: action.mode
						}
					}
				};
			}
		case ActionType.ChangeGridDisplay:
			return {
				...state,
				calibrationSettings: {
					...state.calibrationSettings,
					showGrid: !state.calibrationSettings.showGrid
				}
			};
		case ActionType.ResetCalibration: {
			editedMaps = state.editedMaps;
			const mapToReset = { ...editedMaps[action.mapID] };
			delete mapToReset.currentPoint;
			delete mapToReset.calibrationResult;
			delete mapToReset.calibrationSet;
			return {
				...state,
				editedMaps: {
					...state.editedMaps,
					[calibrated]: mapToReset
				}
			};
		}
		case ActionType.UpdateMapSource:
			return {
				...state,
				editedMaps: {
					...state.editedMaps,
					[action.data.id]: {
						...action.data
					}
				}
			};
		case ActionType.EditMapDetails:
			editedMaps = state.editedMaps;
			editedMaps[action.map.id] = action.map;
			return {
				...state,
				editedMaps
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
			byMapID = state.byMapID;
			editedMaps = state.editedMaps;
			if (action.mapID > 0) {
				submitting.splice(submitting.indexOf(action.mapID));
				byMapID[action.mapID] = { ...editedMaps[action.mapID] };
			}
			delete editedMaps[action.mapID];
			return {
				...state,
				calibratingMap: 0,
				submitting,
				editedMaps,
				byMapID
			};
		case ActionType.DeleteMap:
			editedMaps = state.editedMaps;
			delete editedMaps[action.mapID];
			byMapID = state.byMapID;
			delete byMapID[action.mapID];
			return {
				...state,
				editedMaps,
				byMapID
			};
		case ActionType.UpdateCurrentCartesian: {
			const newDataPoint: CalibratedPoint = {
				cartesian: action.currentCartesian,
				gps: { longitude: -1, latitude: -1 }
			};
			return {
				...state,
				editedMaps: {
					...state.editedMaps,
					[calibrated]: {
						...state.editedMaps[calibrated],
						currentPoint: newDataPoint
					}
				}
			};
		}
		case ActionType.ResetCurrentPoint:
			return {
				...state,
				editedMaps: {
					...state.editedMaps,
					[calibrated]: {
						...state.editedMaps[calibrated],
						currentPoint: undefined
					}
				}
			};
		case ActionType.AppendCalibrationSet: {
			const originalSet = state.editedMaps[calibrated].calibrationSet;
			let copiedSet;
			if (originalSet) {
				copiedSet = originalSet.map(point => point);
				copiedSet.push(action.calibratedPoint);
			} else {
				copiedSet = [action.calibratedPoint];
			}
			return {
				...state,
				editedMaps: {
					...state.editedMaps,
					[calibrated]: {
						...state.editedMaps[calibrated],
						calibrationSet: copiedSet
					}
				}
			};
		}
		case ActionType.UpdateCalibrationResults:
			return {
				...state,
				editedMaps: {
					...state.editedMaps,
					[calibrated]: {
						...state.editedMaps[calibrated],
						calibrationResult: action.result
					}
				}
			};
		default:
			return state;
	}
}
export const selectMapState = (state: RootState) => state.maps;