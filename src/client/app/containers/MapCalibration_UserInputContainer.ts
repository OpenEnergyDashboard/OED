/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {connect} from 'react-redux';
import { State } from '../types/redux/state';
import { Dispatch } from '../types/redux/actions';
import { MapModeTypes } from '../types/redux/map';
import MapCalibration_InfoDisplayComponent from '../components/MapCalibration_InfoDisplayComponent';

function mapStateToProps(state: State) {
	return {
		// Todo: functions used to store calibrated map scales in database also goes here
	}
}
// export default connect(mapStateToProps)(MapCalibration_InfoDisplayComponent);
