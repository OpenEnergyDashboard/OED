/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import HeaderButtonsComponent from '../components/HeaderButtonsComponent';
import { Dispatch } from '../types/redux/actions';
import { State } from '../types/redux/state';
import { deleteToken } from '../utils/token';
import { isRoleAdmin } from '../utils/hasPermissions';
import { clearCurrentUser } from '../actions/currentUser';
import { UserRole } from '../types/items';
import { flipLogOutState } from '../actions/unsavedWarning';

/* eslint-disable */

function mapStateToProps(state: State, ownProps: { showCollapsedMenuButton: boolean, isModal: boolean}) {
	const currentUser = state.currentUser.profile;
	let loggedInAsAdmin = false;
	let role: UserRole | null = null;
	if (currentUser !== null) {
		loggedInAsAdmin = isRoleAdmin(currentUser.role);
		role = currentUser.role;
	}
	return {
		loggedInAsAdmin,
		role,
		...ownProps,
		hasUnsavedChanges: state.unsavedWarning.hasUnsavedChanges
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		handleLogOut: () => {
			deleteToken();
			dispatch(clearCurrentUser());
		},
		flipLogOutState: () => dispatch(flipLogOutState())
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(HeaderButtonsComponent);

