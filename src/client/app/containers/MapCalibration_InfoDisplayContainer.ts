/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {connect} from 'react-redux';
import { State } from '../types/redux/state';
import { Dispatch } from '../types/redux/actions';
import { CalibrationModeTypes } from '../types/redux/map';
import MapCalibration_InfoDisplayComponent from '../components/MapCalibration_InfoDisplayComponent';
import {resetCurrentPoint, offerCurrentGPS, uploadMapData} from "../actions/map";
import {GPSPoint, CalibratedPoint} from "../utils/calibration";

function mapStateToProps(state: State) {
	const resultDisplay = (state.maps.calibrationResult.maxError)?
		`x: ${state.maps.calibrationResult.maxError.x}%, y: ${state.maps.calibrationResult.maxError.y}%`
		: "Need more points";
	const currentPoint: CalibratedPoint = state.maps.currentPoint;
	const currentCartesianDisplay = `x: ${currentPoint.cartesian.x}, y: ${currentPoint.cartesian.y}`;
	return {
		currentCartesianDisplay: currentCartesianDisplay,
		resultDisplay: resultDisplay,
	}
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		updateGPSCoordinates: (gpsCoordinate: GPSPoint) => dispatch(offerCurrentGPS(gpsCoordinate)),
		uploadMap: () => dispatch(uploadMapData()),
	}
}
export default connect(mapStateToProps, mapDispatchToProps)(MapCalibration_InfoDisplayComponent);
