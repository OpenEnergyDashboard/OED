/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import * as _ from 'lodash';
import AddReadingsComponent from '../../components/admin/AddReadingsComponent';
import { updateSelectedMeter } from '../../actions/admin';
import { State } from '../../types/redux/state';
import { Dispatch } from '../../types/redux/actions';
import { NamedIDItem, SelectOption } from '../../types/items';

function mapStateToProps(state: State) {
	let selectedImportMeter;
	if (state.admin.selectedMeter !== null) {
		const meter = state.meters.byMeterID[state.admin.selectedMeter];
		selectedImportMeter = { label: meter.name, value: meter.id } as SelectOption;
	} else {
		selectedImportMeter = null;
	}
	return {
		meters: (_.sortBy(
			_.values(state.meters.byMeterID).map((meter: NamedIDItem) => ({ value: meter.id, label: meter.name.trim() })),
			'name') as SelectOption[]),
		selectedImportMeter
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		updateSelectedImportMeter: (meterID: number) => dispatch(updateSelectedMeter(meterID))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(AddReadingsComponent);
