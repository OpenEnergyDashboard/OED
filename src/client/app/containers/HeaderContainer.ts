/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import HeaderComponent from '../components/HeaderComponent';
import { State } from '../types/redux/state';
import { hasToken } from '../utils/token';
import { isRoleAdmin } from '../utils/hasPermissions';

function mapStateToProps(state: State) {
	const currentUser = state.currentUser.profile;
	let loggedInAsAdmin = false;
	if(currentUser !== null){
		loggedInAsAdmin = hasToken() && isRoleAdmin(currentUser.role);
	}

	return {
		loggedInAsAdmin,
		title: state.admin.displayTitle,
		optionsVisibility: state.graph.optionsVisibility
	};
}

export default connect(mapStateToProps)(HeaderComponent);
