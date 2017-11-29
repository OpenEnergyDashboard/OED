/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Notification } from 'react-notification-system';
import * as topLevelActions from '../actions/notifications';
import { ActionType } from '../types/redux';

export interface NotificationsState {
	notification: Notification;
}

const defaultState = {
	notification: {}
};

export default function topLevel(state = defaultState, action: topLevelActions.NotificationAction) {
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
