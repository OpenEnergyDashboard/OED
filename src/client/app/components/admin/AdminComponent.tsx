/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import PreferencesComponent from './PreferencesComponent';
import AdminSideBar from './AdminSideBar';

/**
 * React component that defines the admin page
 * @returns Admin page element
 */
export default function AdminComponent() {

	const [selectedPreference, setSelectedPreference] = React.useState<string>('graph');

	const titleStyle: React.CSSProperties = {
		textAlign: 'start',
		paddingLeft: '10px',
		margin: 0
	};
	const tooltipStyle = {
		display: 'inline',
		fontSize: '50%'
	};
	return (
		<div className='d-flex vh-100 vw-100 pt-2'>
			<TooltipHelpComponent page='admin' />
			<div className='container-fluid p-0'>
				<h2 style={titleStyle} className='border-top p-2'>
					<FormattedMessage id='admin.preferences' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='admin' helpTextId='help.admin.header' />
					</div>
				</h2>
				<div className='row border mh-100'>
					<AdminSideBar onSelectPreference={setSelectedPreference} selectedPreference={selectedPreference}/>
					<div className='col-9'>
						<div className='col-12 col-lg-6 p-3'>
							<PreferencesComponent selectedPreference={selectedPreference}/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
