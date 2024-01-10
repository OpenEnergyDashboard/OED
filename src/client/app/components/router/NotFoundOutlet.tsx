/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * @returns A component that redirect to the root directory when an unknown route is requested.
 */
export default function NotFound() {
	// redirect to home page if non-existent route is requested.
	return <Navigate to='/' replace />
}