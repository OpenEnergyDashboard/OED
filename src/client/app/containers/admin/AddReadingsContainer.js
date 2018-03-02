/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import _ from 'lodash';
import AddReadingsComponent from '../../components/admin/AddReadingsComponent';
import { updateSelectedMeter } from '../../actions/admin';

function mapStateToProps(state) {
	return {
		meters: _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ value: meter.id, label: meter.name.trim() })), 'name'),
		selectedImportMeter: state.admin.selectedMeter
	};
}

function mapDispatchToProps(dispatch) {
	return {
		updateSelectedImportMeter: meterID => dispatch(updateSelectedMeter(meterID)),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(AddReadingsComponent);
