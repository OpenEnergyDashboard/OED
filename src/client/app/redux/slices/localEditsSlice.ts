import { createEntityAdapter } from '@reduxjs/toolkit';
import { PlotMouseEvent } from 'plotly.js';
import { createThunkSlice } from '../../redux/sliceCreators';
import { CalibrationModeTypes, MapMetadata } from '../../types/redux/map';
import { calibrate, CalibratedPoint, CartesianPoint, GPSPoint } from '../../utils/calibration';
import { mapsAdapter } from '../../redux/entityAdapters';

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
			// const map = localEditAdapter.getSelectors().selectById(state.mapEdits, state.calibratingMap);
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
		updateCurrentCartesian: create.reducer<PlotMouseEvent>((state, { payload }) => {
			// repourposed getClickedCoordinate Events from previous maps implementatinon moved to reducer
			// trace 0 keeps a transparent trace of closely positioned points used for calibration(backgroundTrace),
			// trace 1 keeps the data points used for calibration are automatically added to the same trace(dataPointTrace),
			// event.points will include all points near a mouse click, including those in the backgroundTrace and the dataPointTrace,
			// so the algorithm only looks at trace 0 since points from trace 1 are already put into the data set used for calibration.
			const eligiblePoints = [];
			for (const point of payload.points) {
				const traceNumber = point.curveNumber;
				if (traceNumber === 0) {
					eligiblePoints.push(point);
				}
			}
			// TODO VERIFY
			const xValue = eligiblePoints[0].x as number;
			const yValue = eligiblePoints[0].y as number;
			const clickedPoint: CartesianPoint = {
				x: Number(xValue.toFixed(6)),
				y: Number(yValue.toFixed(6))
			};

			// update calibrating map with new datapoint
			const currentPoint: CalibratedPoint = {
				cartesian: clickedPoint,
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