/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const SHOW_NOTIFICATION = 'SHOW_NOTIFICATION';
export const CLEAR_NOTIFICATIONS = 'CLEAR_NOTIFICATIONS';

/**
 * @param notification object containing { message, level, position, autoDismiss }
 * @returns {{type: string, notification: *}}
 */
export function showNotification(notification) {
	return { type: SHOW_NOTIFICATION, notification };
}

export function clearNotifications() {
	return { type: CLEAR_NOTIFICATIONS };
}
