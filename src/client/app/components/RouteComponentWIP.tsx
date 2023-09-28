/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as moment from 'moment';
import * as queryString from 'query-string';
import * as React from 'react';
import { IntlProvider } from 'react-intl';
import { useDispatch } from 'react-redux';
import { BrowserRouter, Redirect } from 'react-router-dom';
import { CompatRouter, Route, Routes } from 'react-router-dom-v5-compat';
import { TimeInterval } from '../../../common/TimeInterval';
import { LinkOptions, changeOptionsFromLink } from '../actions/graph';
import CreateUserContainer from '../containers/admin/CreateUserContainer';
import UsersDetailContainer from '../containers/admin/UsersDetailContainer';
import UploadCSVContainer from '../containers/csv/UploadCSVContainer';
import MapCalibrationContainer from '../containers/maps/MapCalibrationContainer';
import MapsDetailContainer from '../containers/maps/MapsDetailContainer';
import { useAppSelector } from '../redux/hooks';
import { selectCurrentUser } from '../redux/selectors/authSelectors';
import localeData from '../translations/data';
import { UserRole } from '../types/items';
import { Dispatch } from '../types/redux/actions';
import { ChartTypes, LineGraphRate, MeterOrGroup } from '../types/redux/graph';
import { validateComparePeriod, validateSortingOrder } from '../utils/calculateCompare';
import { hasPermissions } from '../utils/hasPermissions';
import { showErrorNotification } from '../utils/notifications';
import translate from '../utils/translate';
import HomeComponent from './HomeComponent';
import LoginComponent from './LoginComponent';
import AdminComponent from './admin/AdminComponent';
import ConversionsDetailComponent from './conversion/ConversionsDetailComponent';
import GroupsDetailComponent from './groups/GroupsDetailComponent';
import MetersDetailComponent from './meters/MetersDetailComponent';
import UnitsDetailComponent from './unit/UnitsDetailComponent';

/**
 * @returns the router component Currently under migration!
 */
export default function RouteComponent() {
	const dispatch: Dispatch = useDispatch()
	const lang = useAppSelector(state => state.options.selectedLanguage)
	const currentUser = useAppSelector(selectCurrentUser);
	const barStacking = useAppSelector(state => state.graph.barStacking);
	const areaNormalization = useAppSelector(state => state.graph.areaNormalization);
	const minMax = useAppSelector(state => state.graph.showMinMax);
	// selectedLanguage: state.options.selectedLanguage,
	const requireAuth = (component: JSX.Element) => {
		// If state contains token it has been validated on startup or login.
		return !currentUser.token ?
			<Redirect to='/' />
			:
			component
	}
	const requireRole = (requiredRole: UserRole, component: JSX.Element) => {
		//user is authenticated if token and role in state.
		if (currentUser.token && currentUser.profile?.role && hasPermissions(currentUser.profile.role, requiredRole)) {
			// If authenticated, and role requires matched return requested component.
			return component
		}
		return <Redirect to='/' />
	}

	const linkToGraph = (query: string) => {
		const queries = queryString.parse(query);
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
					//TODO validation could be implemented across all cases similar to compare period and sorting order
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
							if (barStacking.toString() !== info) {
								options.toggleBarStacking = true;
							}
							break;
						case 'areaNormalization':
							if (areaNormalization.toString() !== info) {
								options.toggleAreaNormalization = true;
							}
							break;
						case 'areaUnit':
							options.areaUnit = info;
							break;
						case 'minMax':
							if (minMax.toString() !== info) {
								options.toggleMinMax = true;
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
						case 'meterOrGroupID':
							options.meterOrGroupID = parseInt(info);
							break;
						case 'meterOrGroup':
							options.meterOrGroup = info as MeterOrGroup;
							break;
						case 'readingInterval':
							options.readingInterval = parseInt(info);
							break;
						default:
							throw new Error('Unknown query parameter');
					}
				}
				dispatch(changeOptionsFromLink(options))
			} catch (err) {
				showErrorNotification(translate('failed.to.link.graph'));
			}
		}
		// All appropriate state updates should've been executed
		// redirect to clear the link
		return <Redirect to='/' />
	}

	const messages = (localeData as any)[lang];
	return (
		<>
			<IntlProvider locale={lang} messages={messages} key={lang}>
				<BrowserRouter  >
					{/* Compatibility layer for transitioning to react-router 6.X
					Checkout https://github.com/remix-run/react-router/discussions/8753 for details */}
					<CompatRouter >
						<Routes>
							<Route path='/login' element={<LoginComponent />} />
							<Route path='/admin' element={requireAuth(AdminComponent())} />
							<Route path='/csv' element={requireRole(UserRole.CSV, <UploadCSVContainer />)} />
							<Route path='/groups' element={requireRole(UserRole.ADMIN, <GroupsDetailComponent />)} />
							<Route path='/meters' element={requireRole(UserRole.ADMIN, <MetersDetailComponent />)} />
							<Route path='/graph' element={linkToGraph(location.search)} />
							<Route path='/calibration' element={requireAuth(<MapCalibrationContainer />)} />
							<Route path='/maps' element={requireAuth(<MapsDetailContainer />)} />
							<Route path='/users/new' element={requireAuth(<CreateUserContainer />)} />
							<Route path='/users' element={requireAuth(<UsersDetailContainer fetchUsers={() => []} />)} />
							<Route path='/units' element={requireAuth(<UnitsDetailComponent />)} />
							<Route path='/conversions' element={requireAuth(<ConversionsDetailComponent />)} />
							<Route path='*' element={<HomeComponent />} />
						</Routes>
					</CompatRouter>
				</BrowserRouter>
			</IntlProvider>
		</>
	);
}