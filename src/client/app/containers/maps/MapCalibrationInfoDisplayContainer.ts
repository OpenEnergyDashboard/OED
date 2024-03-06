/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {connect} from 'react-redux';
import { State } from '../../types/redux/state';
import { Dispatch } from '../../types/redux/actions';
import MapCalibrationInfoDisplayComponent from '../../components/maps/MapCalibrationInfoDisplayComponent';
import {changeGridDisplay, dropCalibration, offerCurrentGPS, submitCalibratingMap} from '../../redux/actions/map';
import {GPSPoint} from '../../utils/calibration';
import {logToServer} from '../../redux/actions/logs';
import translate from '../../utils/translate';

function mapStateToProps(state: State) {
	const mapID = state.maps.calibratingMap;
	const map = state.maps.editedMaps[mapID];
	const resultDisplay = (map.calibrationResult) ?
		`x: ${map.calibrationResult.maxError.x}%, y: ${map.calibrationResult.maxError.y}%`
		: translate('need.more.points');
	const currentCartesianDisplay = (map.currentPoint) ?
		`x: ${map.currentPoint.cartesian.x}, y: ${map.currentPoint.cartesian.y}` : translate('undefined');
	return {
		showGrid: state.maps.calibrationSettings.showGrid,
		currentCartesianDisplay,
		resultDisplay
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		updateGPSCoordinates: (gpsCoordinate: GPSPoint) => dispatch(offerCurrentGPS(gpsCoordinate)),
		submitCalibratingMap: () => dispatch(submitCalibratingMap()),
		dropCurrentCalibration: () => dispatch(dropCalibration()),
		log: (level: string, message: string) => dispatch(logToServer(level, message)),
		changeGridDisplay: () => dispatch(changeGridDisplay())
	};
}
export default connect(mapStateToProps, mapDispatchToProps)(MapCalibrationInfoDisplayComponent);
