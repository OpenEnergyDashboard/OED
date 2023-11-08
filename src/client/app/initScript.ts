/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { versionApi } from './redux/api/versionApi';
import { authApi } from './redux/api/authApi';
import { conversionsApi } from './redux/api/conversionsApi';
import { groupsApi } from './redux/api/groupsApi';
import { metersApi } from './redux/api/metersApi';
import { preferencesApi } from './redux/api/preferencesApi';
import { unitsApi } from './redux/api/unitsApi';
import { store } from './store';
import { getToken, hasToken } from './utils/token';


// Method initiates many data fetching calls on startup before react begins to render
export const initializeApp = async () => {
	// There are two primary ways to fetch data with RTKQuery
	// Redux Toolkit generates hooks for use in react components, and standalone initiate dispatches as seen below.
	// https://redux-toolkit.js.org/rtk-query/usage/usage-without-react-hooks

	// These queries will trigger a api request, and add a subscription to the store.
	// Typically they return an unsubscribe method, however we always want to be subscribed to any cache changes for these endpoints.
	store.dispatch(versionApi.endpoints.getVersion.initiate())
	store.dispatch(preferencesApi.endpoints.getPreferences.initiate())
	store.dispatch(unitsApi.endpoints.getUnitsDetails.initiate())
	store.dispatch(conversionsApi.endpoints.getConversionsDetails.initiate())
	store.dispatch(conversionsApi.endpoints.getConversionArray.initiate())

	// If user is an admin, they receive additional meter details.
	// To avoid sending duplicate requests upon startup, verify user then fetch
	// TODO Not working as expected, still pings for meters and groups twice, due to onQueryStarted async call on verify Token
	if (hasToken()) {
		// User has a session token verify before requesting meter/group details
		await store.dispatch(authApi.endpoints.verifyToken.initiate(getToken()))
	}
	// Request meter/group/details
	store.dispatch(metersApi.endpoints.getMeters.initiate())
	store.dispatch(groupsApi.endpoints.getGroups.initiate())
}
