/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import RouteComponent from '../components/RouteComponent';
import { Dispatch } from '../types/redux/actions';
import { State } from '../types/redux/state';
import { changeOptionsFromLink, LinkOptions } from '../actions/graph';
import { clearCurrentUser } from '../actions/currentUser';
import { isRoleAdmin } from '../utils/hasPermissions';

function mapStateToProps(state: State) {
	const currentUser = state.currentUser.profile;
	let loggedInAsAdmin = false;
	if(currentUser !== null){
		loggedInAsAdmin = isRoleAdmin(currentUser.role);
	}

	return {
		barStacking: state.graph.barStacking,
		defaultLanguage: state.admin.defaultLanguage,
		loggedInAsAdmin
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		changeOptionsFromLink: (options: LinkOptions) => dispatch(changeOptionsFromLink(options)),
		clearCurrentUser: () => dispatch(clearCurrentUser())
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(RouteComponent);
