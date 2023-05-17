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
import { ChartTypes, LineGraphRate } from '../types/redux/graph';
import { LanguageTypes } from '../types/redux/i18n';
import { verificationApi } from '../utils/api';
import translate from '../utils/translate';
import { validateComparePeriod, validateSortingOrder } from '../utils/calculateCompare';
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
import GroupsDetailComponent from './groups/GroupsDetailComponent';
import ConversionsDetailComponent from './conversion/ConversionsDetailComponent';
import * as queryString from 'query-string';
import InitializationComponent from './InitializationComponent';

interface RouteProps {
	barStacking: boolean;
	defaultLanguage: LanguageTypes;
	loggedInAsAdmin: boolean;
	role: UserRole;
	renderOnce: boolean;
	areaNormalization: boolean;
	changeOptionsFromLink(options: LinkOptions): Promise<any[]>;
	clearCurrentUser(): any;
	changeRenderOnce(): any;
}

export default class RouteComponent extends React.Component<RouteProps> {
	constructor(props: RouteProps) {
		super(props);
		this.requireAuth = this.requireAuth.bind(this);
		this.linkToGraph = this.linkToGraph.bind(this);
		this.requireRole = this.requireRole.bind(this);
	}

	/**
	 * TODO The following three functions, requireRole, requireAuth, and checkAuth, do not work exactly as intended.
	 * Their async blocks evaluate properly, but the returns inside of them are never honored. The end return statement is always what is evaluated.
	 * Fixing this may require some major changes to how page redirects are done. This is detailed more in issue #817.
	 * The errors can be obtained by putting breakpoints on all returns and then stepping through a page load in a debugger.
	*/

	/**
	 * Generates middleware that requires proper role and authentication for a page route
	 * @param requiredRole The role that is necessary to access a page route
	 * @param component The component of the page redirecting
	 * @returns The page route to continue to (component or home)
	 */
	public requireRole(requiredRole: UserRole, component: JSX.Element) {
		// Redirect route to login page if the auth token does not exist or if the user is not the required role
		if (!hasToken() || !hasPermissions(this.props.role, requiredRole)) {
			return <Redirect to='/' />;
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
				// Route to home page if the auth token is not valid
				// this is never properly honored
				return <Redirect to='/' />;
			}
			return component;
		})();

		return component;
	}

	/**
	 * Middleware function that requires proper authentication for a page route
	 * @param component The component of the page redirecting
	 * @returns The page route to continue to (component or home)
	 */
	public requireAuth(component: JSX.Element) {
		// Redirect route to home page if the auth token does not exist or if the user is not an admin
		if (!hasToken() || !this.props.loggedInAsAdmin) {
			return <Redirect to='/' />;
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
				// this is never properly honored
				return <Redirect to='/' />;
			}
			return component;
		})();
		return component;
	}

	/**
	 * Middleware function that checks proper authentication for a page route
	 * @param component The component of the page redirecting
	 * @returns component
	 */
	public checkAuth(component: JSX.Element) {
		// Only check the token if the auth token exists
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
				}
				// redundant return, not needed even if it did work
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
		/*
		 * This stops the chart links from processing more than once. Initially renderOnce is false
		 * so the code executes but then it is set to true near the end so it will not do it again.
		 * This is somewhat more efficient but, more importantly, it fixed a bug. The URL did not clear
		 * until a different page was loaded. While most selections did not route /graph, some do
		 * so this function is called. The bug was that when the user clicked on bar stacking, that
		 * action caused the action to happen but then it happened again here. This caused the boolean
		 * to flip twice so it was unchanged in the end. It is possible that other issues could exist
		 * but should be gone now.
		*/
		if (!this.props.renderOnce) {
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
						// ESLint does not want const params in the one case it is used so put here.
						let params;
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
							case 'unitID':
								options.unitID = parseInt(info);
								break;
							case 'rate':
								params = info.split(',');
								options.rate = { label: params[0], rate: parseFloat(params[1]) } as LineGraphRate;
								break;
							case 'barDuration':
								options.barDuration = moment.duration(parseInt(info), 'days');
								break;
							case 'barStacking':
								if (this.props.barStacking.toString() !== info) {
									options.toggleBarStacking = true;
								}
								break;
							case 'areaNormalization':
								if (this.props.areaNormalization.toString() !== info) {
									options.toggleAreaNormalization = true;
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
					// The chartlink was processed so note so will not be done again.
					this.props.changeRenderOnce();
					if (Object.keys(options).length > 0) {
						this.props.changeOptionsFromLink(options);
					}
				} catch (err) {
					showErrorNotification(translate('failed.to.link.graph'));
				}
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
								<Route path='/login' component={LoginContainer} />
								<Route path='/admin' render={() => this.requireAuth(AdminComponent())} />
								<Route path='/csv' render={() => this.requireRole(UserRole.CSV, <UploadCSVContainer />)} />
								<Route path='/groups' render={() => this.checkAuth(<GroupsDetailComponent />)} />
								<Route path='/meters' render={() => this.checkAuth(<MetersDetailComponent />)} />
								<Route path='/graph' render={({ location }) => this.linkToGraph(<HomeComponent />, location.search)} />
								<Route path='/calibration' render={() => this.requireAuth(<MapCalibrationContainer />)} />
								<Route path='/maps' render={() => this.requireAuth(<MapsDetailContainer />)} />
								<Route path='/users/new' render={() => this.requireAuth(<CreateUserContainer />)} />
								<Route path='/users' render={() => this.requireAuth(<UsersDetailContainer fetchUsers={() => []} />)} />
								<Route path='/units' render={() => this.requireAuth(<UnitsDetailComponent />)} />
								<Route path='/conversions' render={() => this.requireAuth(<ConversionsDetailComponent />)} />
								<Route path='*' component={HomeComponent} />
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
