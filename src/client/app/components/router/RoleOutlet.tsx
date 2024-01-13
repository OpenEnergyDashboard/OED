/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useWaitForInit } from '../../redux/componentHooks';
import InitializingComponent from './InitializingComponent';
import { UserRole } from '../../types/items';

interface RoleOutletProps {
	role: UserRole
}
/**
 * @param props role to check for before routing user.
 * @returns An outlet that is responsible for Role Routes. Routes users away from certain routes if they don't have permissions.
 */
export default function RoleOutlet(props: RoleOutletProps) {

	// Function that returns a JSX element. Either the requested route's Component, as outlet or back to root
	const { userRole, initComplete } = useWaitForInit();
	// // If state contains token it has been validated on startup or login.
	if (!initComplete) {
		return <InitializingComponent />
	}

	if (userRole === props.role || userRole === UserRole.ADMIN) {
		return <Outlet />
	}

	return <Navigate to='/' replace />
}