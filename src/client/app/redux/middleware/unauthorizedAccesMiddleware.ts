/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { isAsyncThunkAction, isRejected } from '@reduxjs/toolkit';
import { showErrorNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import { AppListener } from '../listenerMiddleware';
import { authApi } from '../api/authApi';

export const unauthorizedRequestListener = (startListening: AppListener) => {
	startListening({
		predicate: action => {
			// Listens for rejected async thunks. if no payload then its an RTK internal call that needs to also be filtered.
			return isAsyncThunkAction(action) && isRejected(action) && action.payload !== undefined;
		},
		effect: (action: any, { dispatch }): void => {
			// Look for token failed responses from server
			const unAuthorizedTokenRequest = (action.payload.status === 401 || action.payload.data?.message === 'Failed to authenticate token.');
			if (unAuthorizedTokenRequest) {
				dispatch(authApi.endpoints.logout.initiate());
				showErrorNotification(translate('invalid.token.login'));
			}
		}
	});
};
