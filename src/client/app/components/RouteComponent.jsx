/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { Router, Route, browserHistory } from 'react-router';
import axios from 'axios';
import moment from 'moment';
import _ from 'lodash';
import InitializationContainer from '../containers/InitializationContainer';
import HomeComponent from './HomeComponent';
import LoginComponent from '../components/LoginComponent';
import AdminContainer from '../containers/AdminContainer';
import GroupMainContainer from '../containers/groups/GroupMainContainer';
import { getToken, hasToken } from '../utils/token';
import { showErrorNotification } from '../utils/notifications';

export default class RouteComponent extends React.Component {
	constructor(props) {
		super(props);
		this.requireAuth = this.requireAuth.bind(this);
		this.linkToGraph = this.linkToGraph.bind(this);
	}

	shouldComponentUpdate() {
		// To ignore warning: [react-router] You cannot change 'Router routes'; it will be ignored
		return false;
	}

	/**
	 * Middleware function that requires proper authentication for a page route
	 * @param nextState The next state of the router
	 * @param replace Function that allows a route redirect
	 */
	requireAuth(nextState, replace) {
		function redirectRoute() {
			replace({
				pathname: '/login',
				state: { nextPathname: nextState.location.pathname }
			});
		}
		// Redirect route to login page if the auth token does not exist
		if (!hasToken()) {
			redirectRoute();
			return;
		}
		// Verify that the auth token is valid
		axios.post('/api/verification/', { token: getToken() }, { validateStatus: status => (status >= 200 && status < 300) || (status === 401 || status === 403) })
			.then(res => {
				// Route to login page if the auth token is not valid
				if (!res.data.success) browserHistory.push('/login');
			})
			// In the case of a server error, the user can't fix the issue. Log it for developers.
			.catch(console.error); // eslint-disable-line no-console
	}

	/**
	 * Middleware function that allows hotlinking to a graph with options
	 * @param nextState The next state of the router
	 * @param replace Function that allows a route redirect
	 */
	linkToGraph(nextState, replace) {
		const queries = nextState.location.query;
		if (!_.isEmpty(queries)) {
			try {
				const options = {};
				for (const [key, info] of Object.entries(queries)) {
					switch (key) {
						case 'meterIDs':
							options.meterIDs = info.split(',').map(s => parseInt(s));
							break;
						case 'groupIDs':
							options.groupIDs = info.split(',').map(s => parseInt(s));
							break;
						case 'chartType':
							options.chartType = info;
							break;
						case 'barDuration':
							options.barDuration = moment.duration(parseInt(info), 'days');
							break;
						case 'barStacking':
							if (this.props.barStacking.toString() !== info) {
								options.changeBarStacking = true;
							}
							break;
						default:
							throw new Error('Unknown query parameter');
					}
				}
				if (Object.keys(options).length > 0) {
					this.props.changeOptionsFromLink(options);
				}
			} catch (err) {
				showErrorNotification('Failed to link to graph');
			}
		}
		replace({
			pathname: '/'
		});
	}

	/**
	 * React component that controls the app's routes
	 * Note that '/admin' and '/groups' requires authentication
	 * @returns JSX to create the RouteComponent
	 */
	render() {
		return (
			<div>
				<InitializationContainer />
				<Router history={browserHistory}>
					<Route path="/login" component={LoginComponent} />
					<Route path="/admin" component={AdminContainer} onEnter={this.requireAuth} />
					<Route path="/groups" component={GroupMainContainer} onEnter={this.requireAuth} />
					<Route path="/graph" component={HomeComponent} onEnter={this.linkToGraph} />
					<Route path="*" component={HomeComponent} />
				</Router>
			</div>
		);
	}
}
