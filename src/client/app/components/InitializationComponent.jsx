/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import _ from 'lodash';
import NotificationSystem from 'react-notification-system';

export default class InitializationComponent extends React.Component {
	componentWillMount() {
		this.props.fetchMetersDetailsIfNeeded();
		this.props.fetchPreferencesIfNeeded();
	}

	componentWillReceiveProps(nextProps) {
		if (!_.isEmpty(nextProps.notification)) {
			this.notificationSystem.addNotification(nextProps.notification);
			this.props.clearNotifications();
		}
	}

	render() {
		return (
			<div>
				<NotificationSystem ref={c => { this.notificationSystem = c; }} />
			</div>
		);
	}
}
