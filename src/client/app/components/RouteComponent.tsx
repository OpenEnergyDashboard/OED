/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Route, Router, Switch, Redirect } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import localeData from '../translations/data';
import { browserHistory } from '../utils/history';
import * as _ from 'lodash';
import * as moment from 'moment';
import HomeComponent from './HomeComponent';
import LoginContainer from '../containers/LoginContainer';
import AdminComponent from './admin/AdminComponent';
import { LinkOptions } from 'actions/graph';
import { hasToken, deleteToken } from '../utils/token';
import { showErrorNotification } from '../utils/notifications';
import { ChartTypes } from '../types/redux/graph';
import { LanguageTypes } from '../types/redux/i18n';
import { verificationApi } from '../utils/api';
import translate from '../utils/translate';
import { validateComparePeriod, validateSortingOrder } from '../utils/calculateCompare';
import EditGroupsContainer from '../containers/groups/EditGroupsContainer';
import CreateGroupContainer from '../containers/groups/CreateGroupContainer';
import GroupsDetailContainer from '../containers/groups/GroupsDetailContainer';
import UsersDetailContainer from '../containers/admin/UsersDetailContainer';
import CreateUserContainer from '../containers/admin/CreateUserContainer';
import { TimeInterval } from '../../../common/TimeInterval';
import MapsDetailContainer from '../containers/maps/MapsDetailContainer';
import MapCalibrationContainer from '../containers/maps/MapCalibrationContainer';
import UploadCSVContainer from '../containers/csv/UploadCSVContainer';
import { UserRole } from '../types/items';
import { hasPermissions } from '../utils/hasPermissions';
import UnitsDetailComponent from './unit/UnitsDetailComponent';
import MetersDetailComponent from './meters/MetersDetailComponent';
import ConversionsDetailComponent from './conversion/ConversionsDetailComponent';
import * as queryString from 'query-string';
import InitializationComponent from './InitializationComponent';

interface RouteProps {
	barStacking: boolean;
	defaultLanguage: LanguageTypes;
	loggedInAsAdmin: boolean;
	role: UserRole;
	changeOptionsFromLink(options: LinkOptions): Promise<any[]>;
	clearCurrentUser(): any;
}

export default class RouteComponent extends React.Component<RouteProps> {
	constructor(props: RouteProps) {
		super(props);
		this.requireAuth = this.requireAuth.bind(this);
		this.linkToGraph = this.linkToGraph.bind(this);
		this.requireRole = this.requireRole.bind(this);
	}

	/**
	 * Generates middleware that requires proper role and authentication for a page route
	 * @param requiredRole The role that is necessary to access a page route
	 * @param component The component of the page redirecting
	 * @returns middleware that requires proper role and authentication for a page route
	 */
	public requireRole(requiredRole: UserRole, component: JSX.Element) {
		// Redirect route to login page if the auth token does not exist
		if (!hasToken()) {
			return <Redirect to='/login'/>;
		}

		// Verify that the auth token is valid.
		// Needs to be async because of the network request
		(async () => {
			if (!(await verificationApi.checkTokenValid())) {
				showErrorNotification(translate('invalid.token.login.admin'));
				// We should delete the token when we know that it is expired. Ensures that we don't not leave any unwanted tokens around.
				deleteToken();
				// This ensures that if there is no token then there is no stale profile in the redux store.
				this.props.clearCurrentUser();
				// Route to login page if the auth token is not valid
				return <Redirect to='/login'/>;
			} else if (!hasPermissions(this.props.role, requiredRole)) {
				// Even though the auth token is valid, we still need to check that the user is a certain role.
				return <Redirect to='/'/>;
			}
			return component;
		})();

		return component;
	}

	/**
	 * Middleware function that requires proper authentication for a page route
	 * @param component The component of the page redirecting
	 */
	public requireAuth(component: JSX.Element) {
		// Redirect route to login page if the auth token does not exist
		if (!hasToken()) {
			return <Redirect to='/login'/>;
		}

		// Verify that the auth token is valid.
		// Needs to be async because of the network request
		(async () => {
			if (!(await verificationApi.checkTokenValid())) {
				showErrorNotification(translate('invalid.token.login.admin'));
				// We should delete the token when we know that it is expired. Ensures that we don't not leave any unwanted tokens around.
				deleteToken();
				// This ensures that if there is no token then there is no stale profile in the redux store.
				this.props.clearCurrentUser();
				// Route to login page since the auth token is not valid
				return <Redirect to='/login'/>;
			} else if (!this.props.loggedInAsAdmin) {
				// Even though the auth token is valid, we still need to check that the user is an admin.
				return <Redirect to='/'/>;
			}
			return component;
		})();
		return component;
	}

	/**
	 * Middleware function that checks proper authentication for a page route
	 * @param component The component of the page redirecting
	 */
	public checkAuth(component: JSX.Element) {
		// Only check the token if the auth token does not exist
		if (hasToken()) {
			// Verify that the auth token is valid.
			// Needs to be async because of the network request
			(async () => {
				if (!(await verificationApi.checkTokenValid())) {
					showErrorNotification(translate('invalid.token.login'));
					// We should delete the token when we know that it is expired. Ensures that we don't not leave any unwanted tokens around.
					deleteToken();
					// This ensures that if there is no token then there is no stale profile in the redux store.
					this.props.clearCurrentUser();
					// Route to login page since the auth token is not valid
					return <Redirect to='/login'/>;
				} else if (!this.props.loggedInAsAdmin) {
					// Even though the auth token is valid, we still need to check that the user is an admin.
					return <Redirect to='/'/>;
				}
				return component;
			})();
		}
		return component;
	}

	/**
	 * Middleware function that allows hotlinking to a graph with options
	 * @param component The component of the page redirecting
	 * @param search The string of queries in the path
	 */
	public linkToGraph(component: JSX.Element, search: string) {
		const queries: any = queryString.parse(search);
		if (!_.isEmpty(queries)) {
			try {
				const options: LinkOptions = {};
				for (const [key, infoObj] of _.entries(queries)) {
					// TODO The upgrade of TypeScript lead to it giving an error for the type of infoObj
					// which it thinks is unknown. I'm not sure why and this is code from the history
					// package (see modules/@types/history/index.d.ts). What follows is a hack where
					// the type is cast to any. This removes the problem and also allowed the removal
					// of the ! to avoid calling toString when it is a bad value. I think this is okay
					// because the toString documentation indicates it works fine with any type including
					// null and unknown. If it does convert then the default case will catch it as an error.
					// I want to get rid of this issue so Travis testing is not stopped by this. However,
					// we should look into this typing issue more to see what might be a better fix.
					const fixTypeIssue: any = infoObj as any;
					const info: string = fixTypeIssue.toString();
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
						case 'mapID':
							options.mapID = (parseInt(info));
							break;
						case 'serverRange':
							options.serverRange = TimeInterval.fromString(info);
							/**
							 * commented out since days from present feature is not currently used
							 */
							// const index = info.indexOf('dfp');
							// if (index === -1) {
							// 	options.serverRange = TimeInterval.fromString(info);
							// } else {
							// 	const message = info.substring(0, index);
							// 	const stringField = this.getNewIntervalFromMessage(message);
							// 	options.serverRange = TimeInterval.fromString(stringField);
							// }
							break;
						case 'sliderRange':
							options.sliderRange = TimeInterval.fromString(info);
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
		return component;
	}

	/**
	 * React component that controls the app's routes
	 * Note that '/admin', '/editGroup', and '/createGroup' requires authentication
	 * @returns JSX to create the RouteComponent
	 */
	public render() {
		const lang = this.props.defaultLanguage;
		const messages = (localeData as any)[lang];
		return (
			<div>
				<InitializationComponent />
				<IntlProvider locale={lang} messages={messages} key={lang}>
					<>
						<Router history={browserHistory}>
							<Switch>
								<Route path='/login' component={LoginContainer}/>
								<Route path='/admin' render={() => this.requireAuth(AdminComponent())}/>
								<Route path='/csv' render={() => this.requireRole(UserRole.CSV, <UploadCSVContainer/>)}/>
								<Route path='/groups' render={() => this.checkAuth(<GroupsDetailContainer/>)}/>
								<Route path='/meters' render={() => this.checkAuth(<MetersDetailComponent/>)}/>
								<Route path='/graph' render={({ location }) => this.linkToGraph(<HomeComponent/>, location.search)}/>
								<Route path='/calibration' render={() => this.requireAuth(<MapCalibrationContainer/>)}/>
								<Route path='/maps' render={() => this.requireAuth(<MapsDetailContainer/>)}/>
								<Route path='/createGroup' render={() => this.requireAuth(<CreateGroupContainer/>)}/>
								<Route path='/editGroup' render={() => this.requireAuth(<EditGroupsContainer/>)}/>
								<Route path='/users/new' render={() => this.requireAuth(<CreateUserContainer/>)}/>
								<Route path='/users' render={() => this.requireAuth(<UsersDetailContainer fetchUsers={() => []}/>)}/>
								<Route path='/units'render={() => this.requireAuth(<UnitsDetailComponent />)}/>
								<Route path='/conversions' render={() => this.requireAuth(<ConversionsDetailComponent />)}/>
								<Route path='*' component={HomeComponent}/>
							</Switch>
						</Router>
					</>
				</IntlProvider>
			</div>
		);
	}

	/**
	 * Generates new time interval based on current time and user selected amount to trace back;
	 * @param message: currently able to accept how many days to go back in time;
	 */
	// private getNewIntervalFromMessage(message: string) {
	// 	const numDays = parseInt(message);
	//
	// If we ever use this code we might need to fix up moment for UTC as elsewhere in the code.
	// 	const current = moment();
	// 	const newMinTimeStamp = current.clone();
	// 	newMinTimeStamp.subtract(numDays, 'days');
	// 	return newMinTimeStamp.toISOString().substring(0, 19) + 'Z_' + current.toISOString().substring(0, 19) + 'Z';
	// }
}
