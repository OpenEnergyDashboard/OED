/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import { User } from '../types/items';
import LoginComponent from '../components/LoginComponent';
import { Dispatch } from '../types/redux/actions';
import { currentUserSlice } from '../reducers/currentUser';

/**
 * A container that does data fetching for FooterComponent and connects it to the redux store.
 */
function mapDispatchToProps(dispatch: Dispatch) {
	return {
		saveCurrentUser: (profile: User) => dispatch(currentUserSlice.actions.receiveCurrentUser(profile))
	};
}

export default connect(null, mapDispatchToProps)(LoginComponent);

