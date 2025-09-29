/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useWaitForInit } from '../../redux/componentHooks';
import { useAppDispatch } from '../../redux/reduxHooks';
import InitializingComponent from '../router/InitializingComponent';
import { processGraphLink } from '../../redux/slices/graphSlice';

export const GraphLink = () => {
	const dispatch = useAppDispatch();
	const [searchParams] = useSearchParams();
	const { initComplete } = useWaitForInit();
	React.useEffect(() => {
		const linkIsValid = validateHotlink(searchParams);
		if (linkIsValid) {
			// Passing searchParams directly leads to non-serializable issues with Redux so pass as a string.
			dispatch(processGraphLink(searchParams.toString()));
		}
	}, []);

	if (!initComplete) {
		return <InitializingComponent />;
	}
	return <Navigate to='/' replace />;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const validateHotlink = (params: URLSearchParams) => {
	// TODO VALIDATE HOTLINK
	return true;
};
