/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { PayloadAction } from '@reduxjs/toolkit';
import * as moment from 'moment';
import * as React from 'react';
import { IntlProvider } from 'react-intl';
import { Navigate, Outlet, RouterProvider, createBrowserRouter, useSearchParams } from 'react-router-dom';
import { TimeInterval } from '../../../common/TimeInterval';
import CreateUserContainer from '../containers/admin/CreateUserContainer';
import UploadCSVContainer from '../containers/csv/UploadCSVContainer';
import MapCalibrationContainer from '../containers/maps/MapCalibrationContainer';
import MapsDetailContainer from '../containers/maps/MapsDetailContainer';
import { graphSlice } from '../reducers/graph';
import { useWaitForInit } from '../redux/componentHooks';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import LocaleTranslationData from '../translations/data';
import { UserRole } from '../types/items';
import { ChartTypes, LineGraphRate, MeterOrGroup } from '../types/redux/graph';
import { validateComparePeriod, validateSortingOrder } from '../utils/calculateCompare';
import { AreaUnitType } from '../utils/getAreaUnitConversion';
import { showErrorNotification } from '../utils/notifications';
import translate from '../utils/translate';
import AppLayout from './AppLayout';
import HomeComponent from './HomeComponent';
import LoginComponent from './LoginComponent';
import SpinnerComponent from './SpinnerComponent';
import AdminComponent from './admin/AdminComponent';
import UsersDetailComponentWIP from './admin/UsersDetailComponentWIP';
import ConversionsDetailComponentWIP from './conversion/ConversionsDetailComponentWIP';
import GroupsDetailComponentWIP from './groups/GroupsDetailComponentWIP';
import MetersDetailComponentWIP from './meters/MetersDetailComponentWIP';
import UnitsDetailComponent from './unit/UnitsDetailComponent';


const initCompStyles: React.CSSProperties = {
	width: '100%', height: '100%',
	display: 'flex', flexDirection: 'column',
	alignContent: 'center', alignItems: 'center'
}
export const InitializingComponent = () => {
	return (
		<div style={initCompStyles}>
			<p>Initializing</p>
			<SpinnerComponent loading width={50} height={50} />
		</div>

	)
}

export const AdminOutlet = () => {
	const { isAdmin, initComplete } = useWaitForInit();

	if (!initComplete) {
		// Return a spinner until all init queries return and populate cache with data
		return <InitializingComponent />
	}

	// Keeping for now in case changes are desired
	if (isAdmin) {
		return <Outlet />
	}

	return <Navigate to='/' />

}

// Function that returns a JSX element. Either the requested route's Component, as outlet or back to root
export const RoleOutlet = ({ role }: { role: UserRole }) => {
	const { userRole, initComplete } = useWaitForInit();
	// // If state contains token it has been validated on startup or login.
	if (!initComplete) {
		return <InitializingComponent />
	}
	if (userRole === role || userRole === UserRole.ADMIN) {
		return <Outlet />
	}

	return <Navigate to='/' replace />
}

export const NotFound = () => {
	// redirect to home page if non-existent route is requested.
	return <Navigate to='/' replace />
}


// TODO fix this route
export const GraphLink = () => {
	const dispatch = useAppDispatch();
	const [URLSearchParams] = useSearchParams();
	const { initComplete } = useWaitForInit();
	const dispatchQueue: PayloadAction<any>[] = [];
	if (!initComplete) {
		return <InitializingComponent />
	}

	try {
		URLSearchParams.forEach((value, key) => {
			// TODO Needs to be refactored into a single dispatch/reducer pair.
			//TODO validation could be implemented across all cases similar to compare period and sorting order
			switch (key) {
				case 'chartType':
					dispatchQueue.push(graphSlice.actions.changeChartToRender(value as ChartTypes))
					break;
				case 'unitID':
					dispatchQueue.push(graphSlice.actions.updateSelectedUnit(parseInt(value)))
					break;
				case 'rate':
					{
						const params = value.split(',');
						const rate = { label: params[0], rate: parseFloat(params[1]) } as LineGraphRate;
						dispatchQueue.push(graphSlice.actions.updateLineGraphRate(rate))
					}
					break;
				case 'barDuration':
					dispatchQueue.push(graphSlice.actions.updateBarDuration(moment.duration(parseInt(value), 'days')))
					break;
				case 'barStacking':
					dispatchQueue.push(graphSlice.actions.setBarStacking(Boolean(value)))
					break;
				case 'areaNormalization':
					dispatchQueue.push(graphSlice.actions.setAreaNormalization(value === 'true' ? true : false))
					break;
				case 'areaUnit':
					dispatchQueue.push(graphSlice.actions.updateSelectedAreaUnit(value as AreaUnitType))
					break;
				case 'minMax':
					dispatchQueue.push(graphSlice.actions.setShowMinMax(value === 'true' ? true : false))
					break;
				case 'comparePeriod':
					dispatchQueue.push(graphSlice.actions.updateComparePeriod({ comparePeriod: validateComparePeriod(value), currentTime: moment() }))
					break;
				case 'compareSortingOrder':
					dispatchQueue.push(graphSlice.actions.changeCompareSortingOrder(validateSortingOrder(value)))
					break;
				case 'optionsVisibility':
					dispatchQueue.push(graphSlice.actions.setOptionsVisibility(value === 'true' ? true : false))
					break;
				case 'mapID':
					// dispatchQueue.push(graphSlice.actions.map)
					console.log('Todo, FIXME! Maplink not working')
					break;
				case 'serverRange':
					dispatchQueue.push(graphSlice.actions.updateTimeInterval(TimeInterval.fromString(value)));
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
					dispatchQueue.push(graphSlice.actions.changeSliderRange(TimeInterval.fromString(value)));
					break;
				case 'meterOrGroupID':
					dispatchQueue.push(graphSlice.actions.updateThreeDMeterOrGroupID(parseInt(value)));
					break;
				case 'meterOrGroup':
					dispatchQueue.push(graphSlice.actions.updateThreeDMeterOrGroup(value as MeterOrGroup));
					break;
				case 'readingInterval':
					dispatchQueue.push(graphSlice.actions.updateThreeDReadingInterval(parseInt(value)));
					break;
				case 'meterIDs':
					dispatchQueue.push(graphSlice.actions.updateSelectedMeters(value.split(',').map(s => parseInt(s))))
					break;
				case 'groupIDs':
					dispatchQueue.push(graphSlice.actions.updateSelectedGroups(value.split(',').map(s => parseInt(s))))
					break;
				default:
					throw new Error('Unknown query parameter');
			}
		})
	} catch (err) {
		showErrorNotification(translate('failed.to.link.graph'));
	}
	dispatchQueue.forEach(dispatch)
	// All appropriate state updates should've been executed
	// redirect to clear the link

	return <Navigate to='/' replace />

}


/// Router
const router = createBrowserRouter([
	{
		path: '/', element: <AppLayout />,
		children: [
			{ index: true, element: <HomeComponent /> },
			{ path: 'login', element: <LoginComponent /> },
			{ path: 'groups', element: <GroupsDetailComponentWIP /> },
			{ path: 'meters', element: <MetersDetailComponentWIP /> },
			{ path: 'graph', element: <GraphLink /> },
			{
				element: <AdminOutlet />,
				children: [
					{ path: 'admin', element: <AdminComponent /> },
					{ path: 'calibration', element: <MapCalibrationContainer /> },
					{ path: 'maps', element: <MapsDetailContainer /> },
					{ path: 'users/new', element: <CreateUserContainer /> },
					{ path: 'units', element: <UnitsDetailComponent /> },
					{ path: 'conversions', element: <ConversionsDetailComponentWIP /> },
					{ path: 'users', element: <UsersDetailComponentWIP /> }
				]
			},
			{
				element: <RoleOutlet role={UserRole.CSV} />,
				children: [
					{ path: 'csv', element: <UploadCSVContainer /> }
				]
			},
			{ path: '*', element: <NotFound /> }
		]
	}
])

/**
 * @returns the router component Currently under migration!
 */
export default function RouteComponentWIP() {
	const lang = useAppSelector(state => state.options.selectedLanguage)
	const messages = (LocaleTranslationData as any)[lang];
	return (
		<IntlProvider locale={lang} messages={messages} key={lang}>
			<RouterProvider router={router} />
		</IntlProvider>
	);
}