/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import InitializationComponent from '../components/InitializationComponent';
import { clearNotifications } from '../actions/notifications';
import { fetchMetersDetailsIfNeeded } from '../actions/meters';
import { fetchGroupsDetailsIfNeeded } from '../actions/groups';
import { changeOptionsFromLink } from '../actions/graph';
import { fetchPreferencesIfNeeded } from '../actions/admin';
import {Dispatch, State} from '../types/redux';


function mapStateToProps(state: State) {
	return {
		notification: state.notifications.notification
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		clearNotifications: () => dispatch(clearNotifications()),
		fetchMetersDetailsIfNeeded: () => dispatch(fetchMetersDetailsIfNeeded()),
		fetchGroupDetailsIfNeeded: () => dispatch(fetchGroupsDetailsIfNeeded()),
		fetchPreferencesIfNeeded: () => dispatch(fetchPreferencesIfNeeded()),
		changeOptionsFromLink: options => dispatch(changeOptionsFromLink(options))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(InitializationComponent);
