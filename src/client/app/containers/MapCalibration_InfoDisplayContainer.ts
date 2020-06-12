/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {connect} from 'react-redux';
import { State } from '../types/redux/state';
import { Dispatch } from '../types/redux/actions';
import { CalibrationModeTypes } from '../types/redux/map';
import MapCalibration_InfoDisplayComponent from '../components/MapCalibration_InfoDisplayComponent';
import {resetCurrentPoint, offerCurrentGPS} from "../actions/map";
import {GPSPoint} from "../utils/calibration";

function mapStateToProps(state: State) {
	const calibrationResults = state.map.result;
	const currentCartesian = state.map.currentPoint.getCartesianString();
	return {
		currentCartesian,
		calibrationResults,
	}
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		onReset:() => dispatch(resetCurrentPoint()),
		updateGPSCoordinates: (gpsCoordinate: GPSPoint) => dispatch(offerCurrentGPS(gpsCoordinate))
	}
}
export default connect(mapStateToProps, mapDispatchToProps)(MapCalibration_InfoDisplayComponent);
