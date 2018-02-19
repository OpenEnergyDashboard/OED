/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import _ from 'lodash';
import { connect } from 'react-redux';
import { updateSelectedMeter } from '../actions/admin';
import MeterDropdownComponent from '../components/MeterDropDownComponent';

/**
 * @param {State} state
 */
function mapStateToProps(state) {
	return {
		meters: _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name')
	};
}
function mapDispatchToProps(dispatch) {
	return {
		updateSelectedMeter: meterID => dispatch(updateSelectedMeter(meterID))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MeterDropdownComponent);
