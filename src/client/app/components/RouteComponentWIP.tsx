/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router-dom';
import { CompatRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom-v5-compat';
import { useAppSelector } from '../redux/hooks';
import { selectCurrentUser } from '../redux/selectors/authSelectors';
import localeData from '../translations/data';
import { UserRole } from '../types/items';
// import { hasPermissions } from '../utils/hasPermissions';
import CreateUserContainer from '../containers/admin/CreateUserContainer';
import UploadCSVContainer from '../containers/csv/UploadCSVContainer';
import MapCalibrationContainer from '../containers/maps/MapCalibrationContainer';
import MapsDetailContainer from '../containers/maps/MapsDetailContainer';
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
export default function RouteComponentWIP() {
	const lang = useAppSelector(state => state.options.selectedLanguage)



	const messages = (localeData as any)[lang];
	return (
		<>
			<IntlProvider locale={lang} messages={messages} key={lang}>
				<BrowserRouter  >
					{/*
						Compatibility layer for transitioning to react-router 6	Checkout https://github.com/remix-run/react-router/discussions/8753 for details
					*/}
					{/*
						The largest barrier to completely transitioning is Reworking the UnsavedWarningComponent.
						<Prompt/> is not compatible with react-router v6, and will need to be completely reworked if router-migration goes moves forward.
						The UnsavedWarningComponent is use in many of the admin routes, so it is likely that they will also need to be reworked.
					*/}
					<CompatRouter >
						<Routes>
							<Route path='/' element={<HomeComponent />} />
							<Route path='/login' element={<LoginComponent />} />
							{/* <Route path='/graph' element={linkToGraph(location.search)} />	Currently Broken rework needed*/}
							// Any Route in this must passthrough the admin outlet which checks for authentication status
							<Route path='/' element={<AdminOutlet />}>
								<Route path='/admin' element={<AdminComponent />} />
								<Route path='/calibration' element={<MapCalibrationContainer />} />
								<Route path='/maps' element={<MapsDetailContainer />} />
								<Route path='/users/new' element={<CreateUserContainer />} />
								<Route path='/units' element={<UnitsDetailComponent />} />
								<Route path='/conversions' element={<ConversionsDetailComponent />} />
								<Route path='/groups' element={<GroupsDetailComponent />} />
								<Route path='/meters' element={<MetersDetailComponent />} />
								{/* <Route path='/users' element={<UsersDetailContainer />} /> */}
							</Route>
							// Any Route in this must passthrough the admin outlet which checks for authentication status
							<Route path='/' element={<RoleOutlet UserRole={UserRole.CSV} />}>
								<Route path='/csv' element={<UploadCSVContainer />} />
							</Route>
							// Redirect any other invalid route to root
							<Route path='*' element={<NotFound />} />
						</Routes>
					</CompatRouter>
				</BrowserRouter>
			</IntlProvider>
		</>
	);
}
const AdminOutlet = () => {
	const currentUser = useAppSelector(selectCurrentUser);
	// If state contains token/ userRole it has been validated on startup or login.
	if (currentUser.token && currentUser.profile?.role === UserRole.ADMIN) {
		// Outlet returns the requested route's component i.e /amin returns <AdminComponent/> etc,
		return <Outlet />
	} else {
		return <Navigate to='/' />
	}
}

// Function that returns a JSX element. Either the requested route's Component, as outlet or back to root
const RoleOutlet = ({ UserRole }: { UserRole: UserRole }) => {
	const currentUser = useAppSelector(selectCurrentUser);
	// If state contains token it has been validated on startup or login.
	if (currentUser.profile?.role === UserRole) {
		return <Outlet />
	} else {
		return <Navigate to='/' />
	}
}
const NotFound = () => {
	return <Navigate to='/' />
}


//  FIX ME
// const linkToGraph = (query: string) => {
// 	const queries = queryString.parse(query);
// 	if (!_.isEmpty(queries)) {
// 		try {
// 			const options: LinkOptions = {};
// 			for (const [key, infoObj] of _.entries(queries)) {
// 				// TODO The upgrade of TypeScript lead to it giving an error for the type of infoObj
// 				// which it thinks is unknown. I'm not sure why and this is code from the history
// 				// package (see modules/@types/history/index.d.ts). What follows is a hack where
// 				// the type is cast to any. This removes the problem and also allowed the removal
// 				// of the ! to avoid calling toString when it is a bad value. I think this is okay
// 				// because the toString documentation indicates it works fine with any type including
// 				// null and unknown. If it does convert then the default case will catch it as an error.
// 				// I want to get rid of this issue so Travis testing is not stopped by this. However,
// 				// we should look into this typing issue more to see what might be a better fix.
// 				const fixTypeIssue: any = infoObj as any;
// 				const info: string = fixTypeIssue.toString();
// 				// ESLint does not want const params in the one case it is used so put here.
// 				let params;
// 				//TODO validation could be implemented across all cases similar to compare period and sorting order
// 				switch (key) {
// 					case 'meterIDs':
// 						options.meterIDs = info.split(',').map(s => parseInt(s));
// 						break;
// 					case 'groupIDs':
// 						options.groupIDs = info.split(',').map(s => parseInt(s));
// 						break;
// 					case 'chartType':
// 						options.chartType = info as ChartTypes;
// 						break;
// 					case 'unitID':
// 						options.unitID = parseInt(info);
// 						break;
// 					case 'rate':
// 						params = info.split(',');
// 						options.rate = { label: params[0], rate: parseFloat(params[1]) } as LineGraphRate;
// 						break;
// 					case 'barDuration':
// 						options.barDuration = moment.duration(parseInt(info), 'days');
// 						break;
// 					case 'barStacking':
// 						if (barStacking.toString() !== info) {
// 							options.toggleBarStacking = true;
// 						}
// 						break;
// 					case 'areaNormalization':
// 						if (areaNormalization.toString() !== info) {
// 							options.toggleAreaNormalization = true;
// 						}
// 						break;
// 					case 'areaUnit':
// 						options.areaUnit = info;
// 						break;
// 					case 'minMax':
// 						if (minMax.toString() !== info) {
// 							options.toggleMinMax = true;
// 						}
// 						break;
// 					case 'comparePeriod':
// 						options.comparePeriod = validateComparePeriod(info);
// 						break;
// 					case 'compareSortingOrder':
// 						options.compareSortingOrder = validateSortingOrder(info);
// 						break;
// 					case 'optionsVisibility':
// 						options.optionsVisibility = (info === 'true');
// 						break;
// 					case 'mapID':
// 						options.mapID = (parseInt(info));
// 						break;
// 					case 'serverRange':
// 						options.serverRange = TimeInterval.fromString(info);
// 						/**
// 						 * commented out since days from present feature is not currently used
// 						 */
// 						// const index = info.indexOf('dfp');
// 						// if (index === -1) {
// 						// 	options.serverRange = TimeInterval.fromString(info);
// 						// } else {
// 						// 	const message = info.substring(0, index);
// 						// 	const stringField = this.getNewIntervalFromMessage(message);
// 						// 	options.serverRange = TimeInterval.fromString(stringField);
// 						// }
// 						break;
// 					case 'sliderRange':
// 						options.sliderRange = TimeInterval.fromString(info);
// 						break;
// 					case 'meterOrGroupID':
// 						options.meterOrGroupID = parseInt(info);
// 						break;
// 					case 'meterOrGroup':
// 						options.meterOrGroup = info as MeterOrGroup;
// 						break;
// 					case 'readingInterval':
// 						options.readingInterval = parseInt(info);
// 						break;
// 					default:
// 						throw new Error('Unknown query parameter');
// 				}
// 			}
// 			dispatch(changeOptionsFromLink(options))
// 		} catch (err) {
// 			showErrorNotification(translate('failed.to.link.graph'));
// 		}
// 	}
// 	// All appropriate state updates should've been executed
// 	// redirect to clear the link
// 	return <Redirect to='/' />
// }
