/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ActionType } from '../types/redux';
import { Notification } from 'react-notification-system';

export interface ShowNotificationAction {
	type: ActionType.ShowNotification;
	notification: Notification;
}

export interface ClearNotificationAction {
	type: ActionType.ClearNotifications;
}

export type NotificationAction = ShowNotificationAction | ClearNotificationAction;

/**
 * @param notification object containing { message, level, position, autoDismiss }
 * @returns {{type: string, notification: *}}
 */
export function showNotification(notification: Notification): ShowNotificationAction {
	return { type: ActionType.ShowNotification, notification };
}

export function clearNotifications(): ClearNotificationAction {
	return { type: ActionType.ClearNotifications };
}
