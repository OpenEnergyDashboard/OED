/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import MapViewComponent from '../../components/maps/MapViewComponent';
import { Dispatch } from '../../types/redux/actions';
import { State } from '../../types/redux/state';
import {CalibrationModeTypes, MapMetadata} from "../../types/redux/map";
import {editMapDetails, removeMap, setCalibration} from "../../actions/map";

function mapStateToProps(state: State, ownProps: {id: number}) {
	let map = state.maps.byMapID[ownProps.id];
	if (state.maps.editedMaps[ownProps.id]) {
		map = state.maps.editedMaps[ownProps.id];
	}
	return {
		map,
		isEdited: state.maps.editedMaps[ownProps.id] !== undefined,
		isSubmitting: state.maps.submitting.indexOf(ownProps.id) !== -1
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		editMapDetails: (map: MapMetadata) => dispatch(editMapDetails(map)),
		setCalibration: (mode: CalibrationModeTypes, mapID: number) => dispatch(setCalibration(mode, mapID)),
		removeMap: (id: number) => dispatch(removeMap(id))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MapViewComponent);
