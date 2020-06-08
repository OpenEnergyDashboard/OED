/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {connect} from 'react-redux';
import { State } from '../types/redux/state';
import MapChartComponent from '../components/MapChartComponent';
import {updateMapMode, updateMapSource} from '../actions/map';
import {Dispatch} from '../types/redux/actions';
import {MapModeTypes} from '../types/redux/map';

function mapStateToProps(state: State) {
	return {
		mode: state.map.mode,
		isLoading: state.map.isLoading
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		uploadMapImage: (imageURI: string) => dispatch(updateMapSource(imageURI)),
		updateMapMode: (nextMode: MapModeTypes) => dispatch(updateMapMode(nextMode)),
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(MapChartComponent);
