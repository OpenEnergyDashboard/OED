/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import { State } from '../types/redux/state';
import MapInitiateComponent from '../components/MapInitiateComponent';
import { Dispatch } from '../types/redux/actions';
import { updateMapSource, updateMapMode } from '../actions/map';
import { MapModeTypes } from '../types/redux/map';

function mapStateToProps(state: State) {
	const isLoading = state.map.isLoading;
	return {
		isLoading
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		uploadMapImage: (imageURI: string) => dispatch(updateMapSource(imageURI)),
		updateMapMode: (nextMode: MapModeTypes) => dispatch(updateMapMode(nextMode))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MapInitiateComponent);
