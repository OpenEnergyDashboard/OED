/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from '../types/redux/actions';
import * as t from '../types/redux/notifications';
import { Notification } from 'react-notification-system';

/* eslint-disable jsdoc/require-returns */
/**
 * Shows notification to the user
 * @param notification Notification to display
 */
export function showNotification(notification: Notification): t.ShowNotificationAction {
	return { type: ActionType.ShowNotification, notification };
}

/**
 * Clears current notifications
 */
export function clearNotifications(): t.ClearNotificationAction {
	return { type: ActionType.ClearNotifications };
}
