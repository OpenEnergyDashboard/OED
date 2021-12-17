/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { removeUnsavedChanges } from '../actions/unsavedWarning';
import { connect } from 'react-redux';
import UnsavedWarningComponent from '../components/UnsavedWarningComponent';
import { State } from '../types/redux/state';
import { Dispatch } from '../types/redux/actions';
 
function mapStateToProps(state: State) {
    return {
        hasUnsavedChanges: state.unsavedWarning.hasUnsavedChanges
    }
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
        removeUnsavedChanges: () => dispatch(removeUnsavedChanges())
	};
}
 
export default connect(mapStateToProps, mapDispatchToProps)(UnsavedWarningComponent);
 