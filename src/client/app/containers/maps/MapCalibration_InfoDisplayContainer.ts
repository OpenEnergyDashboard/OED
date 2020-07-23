/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {connect} from 'react-redux';
import { State } from '../../types/redux/state';
import { Dispatch } from '../../types/redux/actions';
import MapCalibration_InfoDisplayComponent from '../../components/maps/MapCalibration_InfoDisplayComponent';
import {offerCurrentGPS, submitCalibratingMap} from "../../actions/map";
import {GPSPoint} from "../../utils/calibration";

function mapStateToProps(state: State) {
	const mapID = state.maps.calibratingMap;
	const map = state.maps.editedMaps[mapID];
	const resultDisplay = (map.calibrationResult)?
		`x: ${map.calibrationResult.maxError.x}%, y: ${map.calibrationResult.maxError.y}%`
		: "Need more points";
	const currentCartesianDisplay =(map.currentPoint)? `x: ${map.currentPoint.cartesian.x}, y: ${map.currentPoint.cartesian.y}` : 'undefined';
	return {
		currentCartesianDisplay: currentCartesianDisplay,
		resultDisplay: resultDisplay,
	}
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		updateGPSCoordinates: (gpsCoordinate: GPSPoint) => dispatch(offerCurrentGPS(gpsCoordinate)),
		submitCalibratingMap: () => dispatch(submitCalibratingMap()),
	}
}
export default connect(mapStateToProps, mapDispatchToProps)(MapCalibration_InfoDisplayComponent);
