/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import store from '../index';
import { showNotification as showNotificationAction } from '../actions/notifications';
import translate from './translate';

export type NotificationPosition = 'tr' | 'tl' | 'tc' | 'br' | 'bl' | 'bc';

export function showSuccessNotification(messageID: string, position: NotificationPosition = 'tr', autoDismiss = 3) {
	store.dispatch(showNotificationAction({
		message: translate(messageID),
		level: 'success',
		position,
		autoDismiss
	}));
}

export function showErrorNotification(messageID: string, position: NotificationPosition = 'tr', autoDismiss = 3) {
	store.dispatch(showNotificationAction({
		message: translate(messageID),
		level: 'error',
		position,
		autoDismiss
	}));
}
