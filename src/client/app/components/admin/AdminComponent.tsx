/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import PreferencesComponent from './PreferencesComponent';

/**
 * React component that defines the admin page
 * @returns Admin page element
 */
export default function AdminComponent() {
	const titleStyle: React.CSSProperties = {
		textAlign: 'center'
	};
	const tooltipStyle = {
		display: 'inline',
		fontSize: '50%'
	};
	return (
		<div>
			<TooltipHelpComponent page='admin' />
			<h2 style={titleStyle}>
				<FormattedMessage id='admin.settings' />
				<div style={tooltipStyle}>
					<TooltipMarkerComponent page='admin' helpTextId='help.admin.header' />
				</div>
			</h2>
			<div className='container-fluid'>
				<div className='d-inline-flex flex-column align-items-center justify-content-center w-100'>
					<div className='col-12 col-lg-6 border border-4 rounded p-4 vw-50'>
						<PreferencesComponent />
					</div>
				</div>
			</div>
		</div>
	);
}
