/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import RouteComponent from '../components/RouteComponent';
import { Dispatch } from '../types/redux/actions';
import { State } from '../types/redux/state';
import { changeOptionsFromLink, LinkOptions } from '../actions/graph';
import { isRoleAdmin } from '../utils/hasPermissions';
import { UserRole } from '../types/items';
import { graphSlice } from '../reducers/graph';
import { currentUserSlice } from '../reducers/currentUser';

function mapStateToProps(state: State) {
	const currentUser = state.currentUser.profile;
	let loggedInAsAdmin = false;
	let role: UserRole | null = null;
	if (currentUser !== null) {
		loggedInAsAdmin = isRoleAdmin(currentUser.role);
		role = currentUser.role;
	}

	return {
		barStacking: state.graph.barStacking,
		selectedLanguage: state.options.selectedLanguage,
		loggedInAsAdmin,
		role,
		// true if the chartlink rendering has been done.
		renderOnce: state.graph.renderOnce,
		areaNormalization: state.graph.areaNormalization,
		minMax: state.graph.showMinMax
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		changeOptionsFromLink: (options: LinkOptions) => dispatch(changeOptionsFromLink(options)),
		clearCurrentUser: () => dispatch(currentUserSlice.actions.clearCurrentUser()),
		// Set the state to indicate chartlinks have been rendered.
		changeRenderOnce: () => dispatch(graphSlice.actions.confirmGraphRenderOnce())
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(RouteComponent);
