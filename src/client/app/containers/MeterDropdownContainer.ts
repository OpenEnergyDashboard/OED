/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { connect } from 'react-redux';
import MeterDropdownComponent from '../components/MeterDropDownComponent';
import { State } from '../types/redux/state';
import { Dispatch } from '../types/redux/actions';
import { adminSlice } from '../reducers/admin';

function mapStateToProps(state: State) {
	return {
		meters: _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name })), 'name')
	};
}
function mapDispatchToProps(dispatch: Dispatch) {
	return {
		updateSelectedMeter: (meterID: number) => dispatch(adminSlice.actions.updateImportMeter(meterID))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MeterDropdownComponent);
