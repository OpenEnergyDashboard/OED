/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import MapCalibration_InitiateComponent from '../../components/maps/MapCalibration_InitiateComponent';
import { connect } from 'react-redux';
import { Dispatch } from '../../types/redux/actions';
import {updateMapMode, updateMapSource} from "../../actions/map";
import {CalibrationModeTypes, MapMetadata} from "../../types/redux/map";
import {State} from "../../types/redux/state";

function mapStateToProps(state: State) {
	return {
		map: state.maps.byMapID[state.maps.calibratingMap]
	}
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		updateMapMode: (nextMode: CalibrationModeTypes) => dispatch(updateMapMode(nextMode)),
		onSourceChange: (data: MapMetadata) => dispatch(updateMapSource(data)),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MapCalibration_InitiateComponent);
