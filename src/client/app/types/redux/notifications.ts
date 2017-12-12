/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ActionType } from './actions';
import { Notification } from 'react-notification-system';

export interface ShowNotificationAction {
	type: ActionType.ShowNotification;
	notification: Notification;
}

export interface ClearNotificationAction {
	type: ActionType.ClearNotifications;
}

export type NotificationAction = ShowNotificationAction | ClearNotificationAction;

export interface NotificationsState {
	notification: Notification;
}
