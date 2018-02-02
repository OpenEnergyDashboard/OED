/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import _ from 'lodash';
import AdminComponent from '../components/AdminComponent';
import { updateDisplayTitle, updateDefaultChartToRender, toggleDefaultBarStacking, submitPreferencesIfNeeded, updateSelectedMeter } from '../actions/admin';

function mapStateToProps(state) {
	return {
		displayTitle: state.admin.displayTitle,
		defaultChartToRender: state.admin.defaultChartToRender,
		defaultBarStacking: state.admin.defaultBarStacking,
		disableSubmitPreferences: state.admin.submitted,
		meters: _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ value: meter.id, label: meter.name.trim() })), 'name'),
		selectedImportMeter: state.admin.selectedMeter
	};
}

function mapDispatchToProps(dispatch) {
	return {
		updateSelectedImportMeter: meterID => dispatch(updateSelectedMeter(meterID)),
		updateDisplayTitle: displayTitle => dispatch(updateDisplayTitle(displayTitle)),
		updateDefaultGraphType: defaultChartToRender => dispatch(updateDefaultChartToRender(defaultChartToRender)),
		toggleDefaultBarStacking: () => dispatch(toggleDefaultBarStacking()),
		submitPreferences: () => dispatch(submitPreferencesIfNeeded())
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(AdminComponent);
