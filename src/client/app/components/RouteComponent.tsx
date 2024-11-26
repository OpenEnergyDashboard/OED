/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { IntlProvider } from 'react-intl';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import ReadingsCSVUploadComponent from '../components/csv/ReadingsCSVUploadComponent';
import MetersCSVUploadComponent from '../components/csv/MetersCSVUploadComponent';
import MapCalibrationContainer from '../containers/maps/MapCalibrationContainer';
import MapsDetailContainer from '../containers/maps/MapsDetailContainer';
import { useAppSelector } from '../redux/reduxHooks';
import LocaleTranslationData from '../translations/data';
import { UserRole } from '../types/items';
import AppLayout from './AppLayout';
import HomeComponent from './HomeComponent';
import AdminComponent from './admin/AdminComponent';
import UsersDetailComponent from './admin/users/UsersDetailComponent';
import ConversionsDetailComponent from './conversion/ConversionsDetailComponent';
import GroupsDetailComponent from './groups/GroupsDetailComponent';
import MetersDetailComponent from './meters/MetersDetailComponent';
import AdminOutlet from './router/AdminOutlet';
import { GraphLink } from './router/GraphLinkComponent';
import NotFound from './router/NotFoundOutlet';
import RoleOutlet from './router/RoleOutlet';
import UnitsDetailComponent from './unit/UnitsDetailComponent';
import ErrorComponent from './router/ErrorComponent';
import { selectSelectedLanguage } from '../redux/slices/appStateSlice';
import VisualUnitDetailComponent from './visual-unit/VisualUnitDetailComponent';

/**
 * @returns the router component Responsible for client side routing.
 */
export default function RouteComponent() {
	const lang = useAppSelector(selectSelectedLanguage);
	const messages = (LocaleTranslationData)[lang];
	return (
		<IntlProvider locale={lang} messages={messages} key={lang}>
			<RouterProvider router={router} />
		</IntlProvider>
	);
}

// Router Responsible for client side routing.
const router = createBrowserRouter([
	{
		// TODO Error Component needs to be implemented, Its currently a bare bones placeholder
		path: '/', element: <AppLayout />, errorElement: <ErrorComponent />,
		children: [
			{ index: true, element: <HomeComponent /> },
			{ path: 'groups', element: <GroupsDetailComponent /> },
			{ path: 'meters', element: <MetersDetailComponent /> },
			{ path: 'graph', element: <GraphLink /> },
			{
				element: <AdminOutlet />,
				children: [
					{ path: 'admin', element: <AdminComponent /> },
					{ path: 'calibration', element: <MapCalibrationContainer /> },
					{ path: 'conversions', element: <ConversionsDetailComponent /> },
					{ path: 'csvMeters', element: <MetersCSVUploadComponent /> },
					{ path: 'maps', element: <MapsDetailContainer /> },
					{ path: 'units', element: <UnitsDetailComponent /> },
					{ path: 'users', element: <UsersDetailComponent /> },
					{ path: 'visual-unit', element: <VisualUnitDetailComponent/> }
				]
			},
			{
				element: <RoleOutlet role={UserRole.CSV} />,
				children: [
					{ path: 'csvReadings', element: <ReadingsCSVUploadComponent /> }
				]
			},
			{ path: '*', element: <NotFound /> }
		]
	}
]);
