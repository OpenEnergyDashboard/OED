/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Notification } from 'react-notification-system';
import { NotificationAction, NotificationsState } from '../types/redux/notifications';
import { ActionType } from '../types/redux/actions';

const defaultState: NotificationsState = {
	notification: {}
};

export default function topLevel(state = defaultState, action: NotificationAction) {
	switch (action.type) {
		case ActionType.ShowNotification:
			return {
				...state,
				notification: action.notification
			};
		case ActionType.ClearNotifications:
			return {
				...state,
				notification: {}
			};
		default:
			return state;
	}
}
