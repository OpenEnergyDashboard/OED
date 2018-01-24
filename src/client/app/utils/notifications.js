/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import store from '../index';
import { showNotification as showNotificationAction } from '../actions/notifications';

export function showSuccessNotification(message, position = 'tr', autoDismiss = 3) {
	store.dispatch(showNotificationAction({
		message,
		level: 'success',
		position,
		autoDismiss
	}));
}

export function showErrorNotification(message, position = 'tr', autoDismiss = 3) {
	store.dispatch(showNotificationAction({
		message,
		level: 'error',
		position,
		autoDismiss
	}));
}
