/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import store from '../index';
import { showNotification as showNotificationAction } from '../actions/notifications';
import { TranslatedString } from './translate';

export type NotificationPosition = 'tr' | 'tl' | 'tc' | 'br' | 'bl' | 'bc';

/**
 * Show user the success notification
 *
 * @param {TranslatedString} message translation identifier for message to display
 * @param {NotificationPosition} position screen position for notification where top, right is the default
 * @param {number} autoDismiss seconds until notification goes away with default of 3 seconds
 */
export function showSuccessNotification(message: TranslatedString, position: NotificationPosition = 'tr', autoDismiss = 3) {
	store.dispatch(showNotificationAction({
		message,
		level: 'success',
		position,
		autoDismiss
	}));
}

/**
 * Show user the error notification
 *
 * @param {TranslatedString} message translation identifier for message to display
 * @param {NotificationPosition} position screen position for notification where top, right is the default
 * @param {number} autoDismiss seconds until notification goes away with default of 3 seconds
 */
export function showErrorNotification(message: TranslatedString, position: NotificationPosition = 'tr', autoDismiss = 3) {
	store.dispatch(showNotificationAction({
		message,
		level: 'error',
		position,
		autoDismiss
	}));
}
