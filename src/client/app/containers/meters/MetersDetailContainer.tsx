/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import MetersDetailComponent from '../../components/meters/MetersDetailComponent';
import { State } from '../../types/redux/state';
import { fetchMetersDetailsIfNeeded, submitEditedMeters } from '../../actions/meters';
import {Dispatch} from '../../types/redux/actions';


function mapStateToProps(state: State) {
	return {
		meters: Object.keys(state.meters.byMeterID)
			.map(key => parseInt(key))
			.filter(key => !isNaN(key)),
		unsavedChanges: Object.keys(state.meters.editedMeters).length > 0
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		fetchMetersDetailsIfNeeded: () => dispatch(fetchMetersDetailsIfNeeded()),
		submitEditedMeters: () => dispatch(submitEditedMeters())
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MetersDetailComponent);
