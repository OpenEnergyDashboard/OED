/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import * as _ from 'lodash';
import NotificationSystem from 'react-notification-system';

export default class InitializationComponent extends React.Component {
	public componentWillMount() {
		this.props.fetchMetersDetailsIfNeeded();
		this.props.fetchPreferencesIfNeeded();
	}

	public componentWillReceiveProps(nextProps) {
		if (!_.isEmpty(nextProps.notification)) {
			this.notificationSystem.addNotification(nextProps.notification);
			this.props.clearNotifications();
		}
	}

	public shouldComponentUpdate() {
		// To ignore warning: [react-router] You cannot change 'Router routes'; it will be ignored
		return false;
	}

	public render() {
		return (
			<div>
				<NotificationSystem ref={c => { this.notificationSystem = c; }} />
			</div>
		);
	}
}
