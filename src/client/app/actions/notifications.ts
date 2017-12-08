/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ActionType } from '../types/redux/actions';
import * as t from '../types/redux/notifications';
import { Notification } from 'react-notification-system';

export function showNotification(notification: Notification): t.ShowNotificationAction {
	return { type: ActionType.ShowNotification, notification };
}

export function clearNotifications(): t.ClearNotificationAction {
	return { type: ActionType.ClearNotifications };
}
