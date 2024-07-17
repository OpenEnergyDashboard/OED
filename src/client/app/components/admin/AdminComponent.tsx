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
		<div className='flexGrowOne d-flex flex-column'>
			<div className='container-fluid flexGrowOne d-flex flex-column'>

				<TooltipHelpComponent page='admin' />
				<h2 style={titleStyle} className='p-2'>
					<FormattedMessage id='admin.settings' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='admin' helpTextId='help.admin.header' />
					</div>
				</h2>
				<div className='row border flexGrowOne'>
					<AdminSideBar onSelectPreference={setSelectedPreference} selectedPreference={selectedPreference}/>
					<div className='col-9'>
						<div className='col-12 col-lg-6 p-3 w-100'>
							<PreferencesComponent selectedPreference={selectedPreference}/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
