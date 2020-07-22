/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import { State } from '../../types/redux/state';
import {Dispatch} from '../../types/redux/actions';
import {fetchMapsDetails, setCalibration, setNewMap, submitEditedMaps} from "../../actions/map";
import MapsDetailComponent from "../../components/maps/MapsDetailComponent";

function mapStateToProps(state: State) {
	return {
		maps: Object.keys(state.maps.byMapID)
			.map(key => parseInt(key))
			.filter(key => !isNaN(key)),
		unsavedChanges: Object.keys(state.maps.editedMaps).length > 0
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		fetchMapsDetails: () => dispatch(fetchMapsDetails()),
		submitEditedMaps: () => dispatch(submitEditedMaps()),
		createNewMap: () => dispatch(setNewMap()),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MapsDetailComponent);
