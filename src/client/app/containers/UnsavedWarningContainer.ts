/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import { flipLogOutState, removeUnsavedChanges } from '../actions/unsavedWarning';
import UnsavedWarningComponent from '../components/UnsavedWarningComponent';
import { Dispatch } from '../types/redux/actions';
import { State } from '../types/redux/state';

/* eslint-disable */

function mapStateToProps(state: State) {
	return {
		hasUnsavedChanges: state.unsavedWarning.hasUnsavedChanges,
		isLogOutClicked: state.unsavedWarning.isLogOutClicked,
		removeFunction: state.unsavedWarning.removeFunction,
		submitFunction: state.unsavedWarning.submitFunction
	}
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		removeUnsavedChanges: () => dispatch(removeUnsavedChanges()),
		flipLogOutState: () => dispatch(flipLogOutState())
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(UnsavedWarningComponent);
