/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dispatch } from 'types/redux/actions';
import { fetchPreferencesIfNeeded } from '../actions/admin';
import { fetchConversionsDetailsIfNeeded } from '../actions/conversions';
import { fetchMapsDetails } from '../actions/map';
import { fetchUnitsDetailsIfNeeded } from '../actions/units';
import { groupsApi } from '../redux/api/groupsApi';
import { metersApi } from '../redux/api/metersApi';
// import { userApi } from '../redux/api/userApi';
import { authApi } from '../redux/api/authApi';
import { ConversionArray } from '../types/conversionArray';
import { getToken, hasToken } from '../utils/token';

/**
 * Initializes OED redux with needed details
 * @returns Initialization JSX element
 */
export default function InitializationComponent() {
	const dispatch: Dispatch = useDispatch();
	// QueryHooks derived by api endpoint definitions
	// These useQuery hooks subscribe to the store, and automatically fetch and cache data to the store.
	metersApi.useGetMetersQuery();
	// metersApi.endpoints.getMeters.useQuery(); Another way to access the same hooks
	groupsApi.useGetGroupsQuery();
	// groupsApi.endpoints.getGroups.useQuery(); Another way to access the same hook
	const [verifyTokenTrigger] = authApi.useVerifyTokenMutation()

	// There are many derived hooks each with different use cases. Read More @ https://redux-toolkit.js.org/rtk-query/api/created-api/hooks#hooks-overview

	// Only run once by making it depend on an empty array.
	useEffect(() => {
		// If user has token from prior logins verify, and fetch user details if valid.
		if (hasToken()) {
			// use the verify token mutation,
			verifyTokenTrigger(getToken())
		}

		dispatch(fetchPreferencesIfNeeded());
		dispatch(fetchMapsDetails());
		dispatch(fetchUnitsDetailsIfNeeded());
		dispatch(fetchConversionsDetailsIfNeeded());
		ConversionArray.fetchPik();
	}, []);

	return (
		<div>
			<ToastContainer transition={Slide} />
		</div>
	);
}
