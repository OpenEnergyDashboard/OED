/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import { State } from '../types/redux/state';
import MapCalibrationComponent from '../components/MapCalibrationComponent';

function mapStateToProps(state: State) {
	return {
		mode: state.map.mode,
		isLoading: state.map.isLoading
	};
}

export default connect(mapStateToProps)(MapCalibrationComponent);
