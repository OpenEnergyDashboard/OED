/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { connect } from 'react-redux';
import InitializationComponent from '../components/InitializationComponent';
import { clearNotifications } from '../actions/notifications';
import { fetchMetersDetailsIfNeeded } from '../actions/meters';
import { fetchGroupsDetailsIfNeeded } from '../actions/groups';
import { changeOptionsFromLink, LinkOptions } from '../actions/graph';
import { fetchPreferencesIfNeeded } from '../actions/admin';
import { State } from '../types/redux/state';
import { Dispatch } from '../types/redux/actions';
import {fetchMapsDetails} from '../actions/map';


function mapStateToProps(state: State) {
	return {
		notification: state.notifications.notification
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		clearNotifications: () => dispatch(clearNotifications()),
		fetchMeterDetailsIfNeeded: () => dispatch(fetchMetersDetailsIfNeeded()),
		fetchGroupDetailsIfNeeded: () => dispatch(fetchGroupsDetailsIfNeeded()),
		fetchPreferencesIfNeeded: () => dispatch(fetchPreferencesIfNeeded()),
		fetchMapDetailsIfNeeded: () => dispatch(fetchMapsDetails()),
		changeOptionsFromLink: (options: LinkOptions) => dispatch(changeOptionsFromLink(options))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(InitializationComponent);
