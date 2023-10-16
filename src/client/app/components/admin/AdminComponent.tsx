/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import FooterContainer from '../../containers/FooterContainer';
import PreferencesContainer from '../../containers/admin/PreferencesContainer';
import ManageUsersLinkButtonComponent from './users/ManageUsersLinkButtonComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { FormattedMessage } from 'react-intl';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';
import HeaderComponent from '../../components/HeaderComponent';

/**
 * React component that defines the admin page
 * @returns Admin page element
 */
export default function AdminComponent() {

	const bottomPaddingStyle: React.CSSProperties = {
		paddingBottom: '15px'
	};

	const sectionTitleStyle: React.CSSProperties = {
		fontWeight: 'bold',
		margin: 0,
		paddingBottom: '5px'
	}
	const titleStyle: React.CSSProperties ={
		textAlign: 'center'
	};
	const tooltipStyle = {
		display: 'inline',
		fontSize: '50%'
	};
	return (
		<div>
			<UnsavedWarningContainer />
			<HeaderComponent />
			<TooltipHelpContainer page='admin' />
			<div className='container-fluid'>
				<h2 style={titleStyle}>
					<FormattedMessage id='admin.panel' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='admin' helpTextId='help.admin.header'/>
					</div>
				</h2>
				<div className='row'>
					<div className='col-12 col-lg-6'>
						<div style={bottomPaddingStyle}>
							<p style={sectionTitleStyle}><FormattedMessage id='manage' />:</p>
							<div>
								<ManageUsersLinkButtonComponent />
							</div>
						</div>
						<PreferencesContainer />
					</div>
				</div>
			</div>
			<FooterContainer />
		</div>
	);
}
