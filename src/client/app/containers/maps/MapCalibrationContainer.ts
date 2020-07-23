/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {connect} from 'react-redux';
import {State} from '../../types/redux/state';
import MapCalibrationComponent from '../../components/maps/MapCalibrationComponent';
import {CalibrationModeTypes} from "../../types/redux/map";

function mapStateToProps(state: State) {
	const mapID = state.maps.calibratingMap;
	return {
		mode: (state.maps.editedMaps[mapID])? state.maps.editedMaps[mapID].calibrationMode: CalibrationModeTypes.unavailable,
		isLoading: false,
		mapID: mapID,
	};
}

export default connect(mapStateToProps)(MapCalibrationComponent);
