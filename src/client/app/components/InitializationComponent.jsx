import React from 'react';
import _ from 'lodash';
import NotificationSystem from 'react-notification-system';

export default class InitializationComponent extends React.Component {
	componentWillMount() {
		this.props.fetchMetersDetailsIfNeeded();
	}

	componentWillReceiveProps(nextProps) {
		if (!_.isEmpty(nextProps.notification)) {
			this.notificationSystem.addNotification(nextProps.notification);
			this.props.clearNotifications();
		}
	}

	shouldComponentUpdate() {
		// To ignore warning: [react-router] You cannot change 'Router routes'; it will be ignored
		return false;
	}

	render() {
		return (
			<div>
				<NotificationSystem ref={c => { this.notificationSystem = c; }} />
			</div>
		);
	}
}
