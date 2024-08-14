/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { createEntityAdapter } from '@reduxjs/toolkit';
import { mapsAdapter } from '../../redux/entityAdapters';
import { createThunkSlice } from '../../redux/sliceCreators';
import { CalibrationModeTypes, MapMetadata } from '../../types/redux/map';
import { calibrate, CalibratedPoint, CartesianPoint, GPSPoint } from '../../utils/calibration';

const localEditAdapter = createEntityAdapter<MapMetadata>();
const localSelectors = localEditAdapter.getSelectors();
export const localEditsSlice = createThunkSlice({
	name: 'localEdits',
	initialState: {
		// Maps
		mapEdits: mapsAdapter.getInitialState(),
		calibratingMap: 0,
		newMapIdCounter: 0,
		calibrationSettings: {
			calibrationThreshold: 3,
			showGrid: false
		}
	},
	reducers: create => ({
		incrementCounter: create.reducer<void>(state => {
			state.newMapIdCounter++;
		}),
		toggleMapShowGrid: create.reducer<void>(state => {
			state.calibrationSettings.showGrid = !state.calibrationSettings.showGrid;
		}),
		setOneEdit: create.reducer<MapMetadata>((state, { payload }) => {
			localEditAdapter.setOne(state.mapEdits, payload);
		}),
		removeOneEdit: create.reducer<number>((state, { payload }) => {
			localEditAdapter.removeOne(state.mapEdits, payload);
		}),
		updateMapCalibrationMode: create.reducer<{ id: number, mode: CalibrationModeTypes }>((state, { payload }) => {
			state.calibratingMap = payload.id;
			localEditAdapter.updateOne(state.mapEdits, {
				id: payload.id,
				changes: { calibrationMode: payload.mode }
			});
		}),
		createNewMap: create.reducer(state => {
			state.newMapIdCounter = state.newMapIdCounter + 1;
			const temporaryID = state.newMapIdCounter * -1;
			state.calibratingMap = temporaryID;
			localEditAdapter.setOne(state.mapEdits, { ...emtpyMapMetadata, id: temporaryID });
		}),
		offerCurrentGPS: create.reducer<GPSPoint>((state, { payload }) => {
			// Stripped offerCurrentGPS thunk into a single reducer for simplicity. The only missing functionality are the serverlogs
			// Current axios approach doesn't require dispatch, however if moved to rtk will. thunks for this adds complexity
			// For simplicity, these logs can instead be tabulated in a middleware.(probably.)
			const map = state.mapEdits.entities[state.calibratingMap];

			const point = map.currentPoint;
			if (point && hasCartesian(point)) {
				point.gps = payload;
				map.calibrationSet.push(point);
				if (map.calibrationSet.length >= state.calibrationSettings.calibrationThreshold) {
					// Since mp is defined above, calibrationSet is defined.
					const result = calibrate(map);
					map.calibrationResult = result;
				}
			}
		}),
		updateCurrentCartesian: create.reducer<CartesianPoint>((state, { payload }) => {
			// update calibrating map with new datapoint
			const currentPoint: CalibratedPoint = {
				cartesian: payload,
				gps: { longitude: -1, latitude: -1 }
			};

			localEditAdapter.updateOne(state.mapEdits, {
				id: state.calibratingMap,
				changes: { currentPoint }
			});
		}),
		resetCalibration: create.reducer<number>((state, { payload }) => {
			localEditAdapter.updateOne(state.mapEdits, {
				id: payload,
				changes: {
					currentPoint: undefined,
					calibrationResult: undefined,
					calibrationSet: []
				}
			});
		})
	}),

	selectors: {
		selectCalibrationMapId: state => state.calibratingMap,
		selectLocalEdit: (state, id: number) => localSelectors.selectById(state.mapEdits, id)
	}
});
export const emtpyMapMetadata: MapMetadata = {
	id: 0,
	name: '',
	displayable: false,
	note: undefined,
	filename: '',
	modifiedDate: '',
	origin: undefined,
	opposite: undefined,
	mapSource: '',
	imgHeight: 0,
	imgWidth: 0,
	calibrationMode: CalibrationModeTypes.initiate,
	currentPoint: undefined,
	calibrationSet: [],
	calibrationResult: undefined,
	northAngle: 0,
	circleSize: 0
};

const hasCartesian = (point: CalibratedPoint) => {
	return point.cartesian.x !== -1 && point.cartesian.y !== -1;
};