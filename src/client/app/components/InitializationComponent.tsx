/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { State } from '../types/redux/state';
import { fetchMetersDetails, fetchMetersDetailsIfNeeded } from '../actions/meters';
import { fetchGroupsDetailsIfNeeded } from '../actions/groups';
import { fetchPreferencesIfNeeded } from '../actions/admin';
import { fetchMapsDetails } from '../actions/map';
import { fetchUnitsDetailsIfNeeded } from '../actions/units';
import { fetchConversionsDetailsIfNeeded } from '../actions/conversions';
import { Dispatch } from 'types/redux/actions';
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchCiksIfNeeded } from '../actions/ciks';

/**
 * Initializes OED redux with needed details
 * @returns Initialization JSX element
 */
export default function InitializationComponent() {

	const dispatch: Dispatch = useDispatch();

	// Only run once by making it depend on an empty array.
	useEffect(() => {
		dispatch(fetchMetersDetailsIfNeeded());
		dispatch(fetchGroupsDetailsIfNeeded());
		dispatch(fetchPreferencesIfNeeded());
		dispatch(fetchMapsDetails());
		dispatch(fetchUnitsDetailsIfNeeded());
		dispatch(fetchConversionsDetailsIfNeeded());
		dispatch(fetchCiksIfNeeded());
	}, []);

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
			<ToastContainer transition={Slide} />
		</div>
	);
}
