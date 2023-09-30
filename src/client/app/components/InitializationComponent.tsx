/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dispatch } from 'types/redux/actions';
import { fetchMapsDetails } from '../actions/map';
import { authApi } from '../redux/api/authApi';
import { conversionsApi } from '../redux/api/conversionsApi';
import { groupsApi } from '../redux/api/groupsApi';
import { metersApi } from '../redux/api/metersApi';
import { preferencesApi } from '../redux/api/preferencesApi';
import { unitsApi } from '../redux/api/unitsApi';
import { ConversionArray } from '../types/conversionArray';
import { getToken, hasToken } from '../utils/token';

/**
 * Initializes the app by fetching and subscribing to the store with various queries
 * @returns Initialization JSX element
 */
export default function InitializationComponent() {
	// QueryHooks derived by api endpoint definitions
	// These useQuery hooks fetch and cache data to the store as soon the component mounts.
	// They maintain an active subscription to the store so long as the component remains mounted.
	// Since this component lives up near the root of the DOM, these queries will remain subscribed indefinitely
	preferencesApi.useGetPreferencesQuery();
	unitsApi.useGetUnitsDetailsQuery();
	conversionsApi.useGetConversionsDetailsQuery();
	conversionsApi.useGetConversionArrayQuery();
	metersApi.useGetMetersQuery();
	groupsApi.useGetGroupsQuery();

	// With RTKQuery, Mutations are used for POST, PUT, PATCH, etc.
	// The useMutation() hooks return a triggerFunction that can be called to initiate the request.
	const [verifyTokenTrigger] = authApi.useVerifyTokenMutation()

	// There are many derived hooks each with different use cases
	// Read More @ https://redux-toolkit.js.org/rtk-query/api/created-api/hooks#hooks-overview

	const dispatch: Dispatch = useDispatch();

	// Only run once by making it depend on an empty array.
	useEffect(() => {
		// If user has token from prior logins verify, and fetch user details if valid.
		if (hasToken()) {
			// use the verify token mutation,
			verifyTokenTrigger(getToken())
		}
		dispatch(fetchMapsDetails());
		ConversionArray.fetchPik();


		// Converted to useHooks()
		// dispatch(fetchMetersDetailsIfNeeded());
		// dispatch(fetchGroupsDetailsIfNeeded());
		// dispatch(fetchPreferencesIfNeeded());
		// dispatch(fetchUnitsDetailsIfNeeded());
		// dispatch(fetchConversionsDetailsIfNeeded());
	}, []);

	return (
		<div>
			<ToastContainer transition={Slide} />
		</div>
	);
}
