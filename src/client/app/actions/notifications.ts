/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const SHOW_NOTIFICATION = 'SHOW_NOTIFICATION';
export const CLEAR_NOTIFICATIONS = 'CLEAR_NOTIFICATIONS';

export interface Notification {
	message: string;
	level: string;
	position: string;
	autoDismiss: number;
}

export interface ShowNotificationAction {
	type: 'SHOW_NOTIFICATION';
	notification: Notification;
}

export interface ClearNotificationAction {
	type: 'CLEAR_NOTIFICATIONS';
}

export type NotificationAction = ShowNotificationAction | ClearNotificationAction;

/**
 * @param notification object containing { message, level, position, autoDismiss }
 * @returns {{type: string, notification: *}}
 */
export function showNotification(notification: Notification) {
	return { type: SHOW_NOTIFICATION, notification };
}

export function clearNotifications() {
	return { type: CLEAR_NOTIFICATIONS };
}
