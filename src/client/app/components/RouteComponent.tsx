/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import axios from 'axios';
import * as _ from 'lodash';
import * as React from 'react';
import * as NotificationSystem from 'react-notification-system';
import { browserHistory, Route, Router } from 'react-router';
import LoginContainer from '../containers/LoginContainer';
import AdminComponent from './AdminComponent';
import HomeComponent from './HomeComponent';
import NotFoundComponent from './NotFoundComponent';

interface RouteProps {
	clearNotifications: () => null;
}

export default class RouteComponent extends React.Component<RouteProps, {}> {
	public notificationSystem: NotificationSystem.System;

	constructor(props) {
		super(props);
		this.requireAuth = this.requireAuth.bind(this);
	}

	public shouldComponentUpdate() {
		// To ignore warning: [react-router] You cannot change 'Router routes'; it will be ignored
		return false;
	}

	public componentWillReceiveProps(nextProps) {
		if (!_.isEmpty(nextProps.notification)) {
			this.notificationSystem.addNotification(nextProps.notification);
			this.props.clearNotifications();
		}
	}

	/**
	 * Middleware function that requires proper authentication for a page route
	 * @param nextState The next state of the router
	 * @param replace Function that allows a route redirect
	 */
	public requireAuth(nextState, replace) {
		function redirectRoute() {
			replace({
				pathname: '/login',
				state: { nextPathname: nextState.location.pathname }
			});
		}
		const token = localStorage.getItem('token');
		// Redirect route to login page if the auth token does not exist
		if (!token) {
			redirectRoute();
			return;
		}
		// Verify that the auth token is valid
		axios.post('/api/verification/', { token }, { validateStatus: status => (status >= 200 && status < 300) || (status === 401 || status === 403) })
			.then(res => {
				// Route to login page if the auth token is not valid
				if (!res.data.success) { browserHistory.push('/login'); }
			})
			// In the case of a server error, the user can't fix the issue. Log it for developers.
			.catch(console.error); // eslint-disable-line no-console
	}

	/**
	 * React component that controls the app's routes
	 * Note that '/admin' requires authentication
	 * @returns JSX to create the RouteComponent
	 */
	public render() {
		return (
			<div>
				<NotificationSystem ref={c => { this.notificationSystem = c; }} />
				<Router history={browserHistory}>
					<Route path="/" component={HomeComponent} />
					<Route path="/login" component={LoginContainer} />
					<Route path="/admin" component={AdminComponent} onEnter={this.requireAuth} />
					<Route path="*" component={NotFoundComponent} />
				</Router>
			</div>
		);
	}
}
