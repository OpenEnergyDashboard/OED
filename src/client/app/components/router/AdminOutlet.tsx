/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useWaitForInit } from '../../redux/componentHooks';
import InitializingComponent from './InitializingComponent';
import { authApi, authPollInterval } from '../../redux/api/authApi';

/**
 * @returns An outlet that is responsible for Admin Routes. Routes non-admin users away from certain routes.
 */
export default function AdminOutlet() {
	const { isAdmin, initComplete } = useWaitForInit();
	authApi.useTokenPollQuery(undefined, { pollingInterval: authPollInterval })
	if (!initComplete) {
		// Return a spinner until all init queries return and populate cache with data
		return <InitializingComponent />
	}
	// if user is an admin return requested route, otherwise redirect to root
	return isAdmin ? <Outlet /> : <Navigate to='/' />
}
