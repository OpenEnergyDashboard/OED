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
import { useAppSelector } from '../redux/hooks';
import { selectIsLoggedInAsAdmin } from '../redux/selectors/authSelectors';
import { ConversionArray } from '../types/conversionArray';
import { getToken, hasToken } from '../utils/token';

/**
 * Initializes the app by fetching and subscribing to the store with various queries
 * @returns Initialization JSX element
 */
export default function InitializationComponent() {
	const dispatch: Dispatch = useDispatch();
	const isAdmin = useAppSelector(state => selectIsLoggedInAsAdmin(state));

	// With RTKQuery, Mutations are used for POST, PUT, PATCH, etc.
	// The useMutation() hooks returns a tuple containing triggerFunction that can be called to initiate the request
	// and an optional results object containing derived data related the the executed query.
	const [verifyTokenTrigger] = authApi.useVerifyTokenMutation()

	// useQueryHooks derived by api endpoint definitions fetch and cache data to the store as soon the component mounts.
	// They maintain an active subscription to the store so long as the component remains mounted.
	// Since this component lives up near the root of the DOM, these queries will remain subscribed indefinitely by default
	preferencesApi.useGetPreferencesQuery();
	unitsApi.useGetUnitsDetailsQuery();
	conversionsApi.useGetConversionsDetailsQuery();
	conversionsApi.useGetConversionArrayQuery();
	metersApi.useGetMetersQuery();

	// Use Query hooks return an object with various derived values related to the query's status which can be destructured as flows
	const { data: groupData, isFetching: groupDataIsFetching } = groupsApi.useGetGroupsQuery();

	// Queries can be conditionally fetched based if optional parameter skip is true;
	// Skip this query if user is not admin
	// When user is an admin, ensure that the initial Group data exists and is not currently fetching
	groupsApi.useGetAllGroupsChildrenQuery(undefined, { skip: (!isAdmin || !groupData || groupDataIsFetching) });



	// There are many derived hooks each with different use cases
	// Read More @ https://redux-toolkit.js.org/rtk-query/api/created-api/hooks#hooks-overview


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
