/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import * as _ from 'lodash';
import * as NotificationSystem from 'react-notification-system';
import { ClearNotificationAction } from '../types/redux/notifications';
import { LinkOptions} from '../actions/graph';

interface InitializationProps {
	notification: Notification;
	clearNotifications(): ClearNotificationAction;
	fetchMeterDetailsIfNeeded(): Promise<any>;
	fetchGroupDetailsIfNeeded(): Promise<any>;
	fetchPreferencesIfNeeded(): Promise<any>;
	changeOptionsFromLink(options: LinkOptions): Promise<any>;
}

export default class InitializationComponent extends React.Component<InitializationProps, {}> {
	private notificationSystem: NotificationSystem.System;

	public componentWillMount() {
		this.props.fetchMeterDetailsIfNeeded();
		this.props.fetchGroupDetailsIfNeeded();
		this.props.fetchPreferencesIfNeeded();
	}

	public componentWillReceiveProps(nextProps: InitializationProps) {
		if (!_.isEmpty(nextProps.notification)) {
			this.notificationSystem.addNotification(nextProps.notification);
			this.props.clearNotifications();
		}
	}

	public render() {
		return (
			<div>
				<NotificationSystem ref={(c: NotificationSystem.System) => { this.notificationSystem = c; }} />
			</div>
		);
	}
}
