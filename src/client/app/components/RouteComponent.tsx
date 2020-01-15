/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Router, Route, RedirectFunction, RouterState } from 'react-router';
import { addLocaleData, IntlProvider } from 'react-intl';
import * as en from 'react-intl/locale-data/en';
import * as fr from 'react-intl/locale-data/fr';
import * as localeData from '../translations/data.json';
import { browserHistory } from '../utils/history';
import * as _ from 'lodash';
import * as moment from 'moment';
import InitializationContainer from '../containers/InitializationContainer';
import HomeComponent from './HomeComponent';
import LoginComponent from '../components/LoginComponent';
import AdminComponent from './admin/AdminComponent';
import { LinkOptions } from 'actions/graph';
import { hasToken } from '../utils/token';
import { showErrorNotification } from '../utils/notifications';
import { ChartTypes } from '../types/redux/graph';
import { LanguageTypes } from '../types/i18n';
import { verificationApi } from '../utils/api';
import translate from '../utils/translate';
import { validateComparePeriod, validateSortingOrder } from '../utils/calculateCompare';
import EditGroupsContainer from '../containers/groups/EditGroupsContainer';
import CreateGroupContainer from '../containers/groups/CreateGroupContainer';
import GroupsDetailContainer from '../containers/groups/GroupsDetailContainer';
import MetersDetailContainer from '../containers/meters/MetersDetailContainer';

interface RouteProps {
	barStacking: boolean;
	defaultLanguage: LanguageTypes;
	changeOptionsFromLink(options: LinkOptions): Promise<any[]>;
}

export default class RouteComponent extends React.Component<RouteProps, {}> {
	constructor(props: RouteProps) {
		super(props);
		this.requireAuth = this.requireAuth.bind(this);
		this.linkToGraph = this.linkToGraph.bind(this);
	}

	/**
	 * Middleware function that requires proper authentication for a page route
	 * @param nextState The next state of the router
	 * @param replace Function that allows a route redirect
	 */
	public requireAuth(nextState: RouterState, replace: RedirectFunction) {
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
		// Verify that the auth token is valid.
		// Needs to be async because of the network request
		(async () => {
			if (!(await verificationApi.checkTokenValid())) {
				// Route to login page if the auth token is not valid
				browserHistory.push('/login');
			}
		})();
	}

	/**
	 * Middleware function that checks proper authentication for a page route
	 * @param nextState The next state of the router
	 * @param replace Function that allows a route redirect
	 */
	public checkAuth(nextState: RouterState, replace: RedirectFunction) {
		function redirectRoute() {
			replace({
				pathname: '/login',
				state: { nextPathname: nextState.location.pathname }
			});
		}
		// Only check the token if the auth token does not exist
		if (hasToken()) {
			// Verify that the auth token is valid.
			// Needs to be async because of the network request
			(async () => {
				if (!(await verificationApi.checkTokenValid())) {
					// Route to login page if the auth token is not valid
					showErrorNotification(translate('invalid.token.login.or.logout'));
					browserHistory.push('/login');
				}
			})();
		}
	}

	/**
	 * Middleware function that allows hotlinking to a graph with options
	 * @param nextState The next state of the router
	 * @param replace Function that allows a route redirect
	 */
	public linkToGraph(nextState: RouterState, replace: RedirectFunction) {
		const queries = nextState.location.query;
		if (!_.isEmpty(queries)) {
			try {
				const options: LinkOptions = {};
				for (const [key, infoObj] of _.entries(queries)) {
					// TODO Verify that this is not null/undefined as travis warning is giving or there is a better fix than this quick one.
					// This removes the static check issue but not a runtime complaint per
					// https://stackoverflow.com/questions/40349987/how-to-suppress-error-ts2533-object-is-possibly-null-or-undefined
					const info: string = infoObj!.toString();
					switch (key) {
						case 'meterIDs':
							options.meterIDs = info.split(',').map(s => parseInt(s));
							break;
						case 'groupIDs':
							options.groupIDs = info.split(',').map(s => parseInt(s));
							break;
						case 'chartType':
							options.chartType = info as ChartTypes;
							break;
						case 'barDuration':
							options.barDuration = moment.duration(parseInt(info), 'days');
							break;
						case 'barStacking':
							if (this.props.barStacking.toString() !== info) {
								options.toggleBarStacking = true;
							}
							break;
						case 'comparePeriod':
							options.comparePeriod = validateComparePeriod(info);
							break;
						case 'compareSortingOrder':
							options.compareSortingOrder = validateSortingOrder(info);
							break;
						case 'optionsVisibility':
							options.optionsVisibility = (info === 'true');
							break;
						default:
							throw new Error('Unknown query parameter');
					}
				}
				if (Object.keys(options).length > 0) {
					this.props.changeOptionsFromLink(options);
				}
			} catch (err) {
				showErrorNotification(translate('failed.to.link.graph'));
			}
		}
		replace('/');
	}

	/**
	 * React component that controls the app's routes
	 * Note that '/admin', '/editGroup', and '/createGroup' requires authentication
	 * @returns JSX to create the RouteComponent
	 */
	public render() {
		addLocaleData([...en, ...fr]);
		const lang = this.props.defaultLanguage;
		let messages;
		if (lang === 'fr') {
			messages = (localeData as any).fr;
		} else {
			messages = (localeData as any).en;
		}
		return (
			<div>
				<InitializationContainer />
				<IntlProvider locale={lang} messages={messages} key={lang}>
					<Router history={browserHistory}>
						<Route path='/login' component={LoginComponent} />
						<Route path='/admin' component={AdminComponent} onEnter={this.requireAuth} />
						<Route path='/groups' component={GroupsDetailContainer} onEnter={this.checkAuth} />
						<Route path='/meters' component={MetersDetailContainer} onEnter={this.checkAuth} />
						<Route path='/graph' component={HomeComponent} onEnter={this.linkToGraph} />
						<Route path='/createGroup' component={CreateGroupContainer} onEnter={this.requireAuth} />
						<Route path='/editGroup' component={EditGroupsContainer} onEnter={this.requireAuth} />
						<Route path='*' component={HomeComponent} />
					</Router>
				</IntlProvider>
			</div>
		);
	}
}
