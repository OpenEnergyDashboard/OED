/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { appStateSlice } from './reducers/appStateSlice';
import { currentUserSlice } from './reducers/currentUser';
import { authApi } from './redux/api/authApi';
import { conversionsApi } from './redux/api/conversionsApi';
import { groupsApi } from './redux/api/groupsApi';
import { metersApi } from './redux/api/metersApi';
import { preferencesApi } from './redux/api/preferencesApi';
import { unitsApi } from './redux/api/unitsApi';
import { userApi } from './redux/api/userApi';
import { versionApi } from './redux/api/versionApi';
import { store } from './store';
import { deleteToken, getToken, hasToken } from './utils/token';


// Method initiates many data fetching calls on startup before react begins to render
export const initializeApp = async () => {
	// These queries will trigger a api request, and add a subscription to the store.
	// Typically they return an unsubscribe method, however we always want to be subscribed to any cache changes for these endpoints.
	store.dispatch(versionApi.endpoints.getVersion.initiate())
	store.dispatch(preferencesApi.endpoints.getPreferences.initiate())
	store.dispatch(unitsApi.endpoints.getUnitsDetails.initiate())
	store.dispatch(conversionsApi.endpoints.getConversionsDetails.initiate())
	store.dispatch(conversionsApi.endpoints.getConversionArray.initiate())

	// If user is an admin, they receive additional meter details.
	// To avoid sending duplicate requests upon startup, verify user then fetch
	if (hasToken()) {
		// User has a session token verify before requesting meter/group details
		try {
			await store.dispatch(authApi.endpoints.verifyToken.initiate(getToken()))
			// Token is valid if not errored out by this point,
			// Apis will now use the token in headers via baseAPI's Prepare Headers
			store.dispatch(currentUserSlice.actions.setUserToken(getToken()))
			//  Get userDetails with verified token in headers
			await store.dispatch(userApi.endpoints.getUserDetails.initiate(undefined, { subscribe: false }))
				.unwrap()
				.catch(e => { throw (e) })

		} catch {
			// User had a token that isn't valid or getUserDetails threw an error.
			// Assume token is invalid. Delete if any
			deleteToken()
		}

	}
	// Request meter/group/details
	store.dispatch(metersApi.endpoints.getMeters.initiate())
	store.dispatch(groupsApi.endpoints.getGroups.initiate())
	store.dispatch(appStateSlice.actions.setInitComplete(true))
}
