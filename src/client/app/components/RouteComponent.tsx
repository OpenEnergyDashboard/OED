/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import {RedirectFunction, Route, Router, RouterState} from 'react-router';
import {addLocaleData, IntlProvider} from 'react-intl';
import * as en from 'react-intl/locale-data/en';
import * as fr from 'react-intl/locale-data/fr';
import * as localeData from '../translations/data.json';
import {browserHistory} from '../utils/history';
import * as _ from 'lodash';
import * as moment from 'moment';
import InitializationContainer from '../containers/InitializationContainer';
import HomeComponent from './HomeComponent';
import LoginComponent from '../components/LoginComponent';
import AdminComponent from './admin/AdminComponent';
import {LinkOptions} from 'actions/graph';
import {hasToken} from '../utils/token';
import {showErrorNotification} from '../utils/notifications';
import {ChartTypes} from '../types/redux/graph';
import {LanguageTypes} from '../types/redux/i18n';
import {verificationApi} from '../utils/api';
import translate from '../utils/translate';
import {validateComparePeriod, validateSortingOrder} from '../utils/calculateCompare';
import EditGroupsContainer from '../containers/groups/EditGroupsContainer';
import CreateGroupContainer from '../containers/groups/CreateGroupContainer';
import GroupsDetailContainer from '../containers/groups/GroupsDetailContainer';
import MetersDetailContainer from '../containers/meters/MetersDetailContainer';
import {TimeInterval} from '../../../common/TimeInterval';
import MapsDetailContainer from '../containers/maps/MapsDetailContainer';
import MapCalibrationContainer from '../containers/maps/MapCalibrationContainer';

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
		const queries: any = nextState.location.query;
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
							options.barDuration = moment.duration(parseInt(info));
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
		} else if (lang === 'es') {
			messages = (localeData as any).es;
		} else {
			messages = (localeData as any).en;
		}
		return (
			<div>
				<InitializationContainer />
				<IntlProvider locale={lang} messages={messages} key={lang}>
					<>
					<Router history={browserHistory}>
						<Route path='/login' component={LoginComponent} />
						<Route path='/admin' component={AdminComponent} onEnter={this.requireAuth} />
						<Route path='/groups' component={GroupsDetailContainer} onEnter={this.checkAuth} />
						<Route path='/meters' component={MetersDetailContainer} onEnter={this.checkAuth} />
						<Route path='/graph' component={HomeComponent} onEnter={this.linkToGraph} />
						<Route path='/calibration' component={MapCalibrationContainer} onEnter={this.requireAuth} />
						<Route path='/maps' component={MapsDetailContainer} onEnter={this.requireAuth} />
						<Route path='/createGroup' component={CreateGroupContainer} onEnter={this.requireAuth} />
						<Route path='/editGroup' component={EditGroupsContainer} onEnter={this.requireAuth} />
						<Route path='*' component={HomeComponent} />
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
	// 	const current = moment();
	// 	const newMinTimeStamp = current.clone();
	// 	newMinTimeStamp.subtract(numDays, 'days');
	// 	return newMinTimeStamp.toISOString().substring(0, 19) + 'Z_' + current.toISOString().substring(0, 19) + 'Z';
	// }
}
