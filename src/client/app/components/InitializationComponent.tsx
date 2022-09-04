/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import * as _ from 'lodash';
import * as NotificationSystem from 'react-notification-system';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { State } from '../types/redux/state';
import { clearNotifications } from '../actions/notifications';
import { fetchMetersDetails, fetchMetersDetailsIfNeeded } from '../actions/meters';
import { fetchGroupsDetailsIfNeeded } from '../actions/groups';
//import { changeOptionsFromLink, LinkOptions } from '../actions/graph';
import { ConversionArray } from '../types/conversionArray';
import { fetchPreferencesIfNeeded } from '../actions/admin';
import { fetchMapsDetails } from '../actions/map';
import { fetchUnitsDetailsIfNeeded } from '../actions/units';
import { fetchConversionsDetailsIfNeeded } from '../actions/conversions';

export default function InitializationComponent() {

	const dispatch = useDispatch();

	let notificationSystem: NotificationSystem.System;

	// Only run once by making it depend on an empty array.
	useEffect(() => {
		dispatch(fetchMetersDetailsIfNeeded());
		dispatch(fetchGroupsDetailsIfNeeded());
		dispatch(fetchPreferencesIfNeeded());
		dispatch(fetchMapsDetails());
		dispatch(fetchUnitsDetailsIfNeeded());
		dispatch(fetchConversionsDetailsIfNeeded());
		ConversionArray.fetchPik();
	}, []);

	// TODO this was from the initializationcontainer but never called, do not know what it is for
	// The commented out import also relates to this.
	//		changeOptionsFromLink: (options: LinkOptions) => dispatch(changeOptionsFromLink(options))

	// Notifications state
	const notification = useSelector((state: State) => state.notifications.notification);
	useEffect(() => {
		// Attempts to add notification on re-render (if there are any)
		if (!_.isEmpty(notification)) {
			notificationSystem.addNotification(notification);
			dispatch(clearNotifications());
		}
	});

	// Rerender the route component if the user state changes
	// This is necessary because of how the meters route works
	// If the user is not an admin, the formatMeterForResponse function sets many of the fetched values to null
	// Because of this must re-fetch the entire meters table if the user changes
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	useEffect(() => {
		dispatch(fetchMetersDetails());
	}, [currentUser]);

	return (
		<div>
			<NotificationSystem ref={(c: NotificationSystem.System) => { notificationSystem = c; }} />
		</div>
	);
}
