/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import HeaderContainer from '../../containers/HeaderContainer';
import FooterContainer from '../../containers/FooterContainer';
import AddMetersContainer from '../../containers/admin/AddMetersContainer';
import AddReadingsContainer from '../../containers/admin/AddReadingsContainer';
import PreferencesContainer from '../../containers/admin/PreferencesContainer';
import TooltipHelpComponent from '../TooltipHelpComponentAlternative';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { FormattedMessage } from 'react-intl';

/**
 * Top-level React component that controls the home page
 * @return JSX to create the home page
 */

export default function AdminComponent() {
	const divMarginTop: React.CSSProperties = {
		marginTop: '50px'
	};
	const titleStyle: React.CSSProperties ={
		textAlign: 'center'
	};
	const tooltipStyle = {
		display: 'inline',
		fontSize: '50%'
	};
	return (
		<div>
			<HeaderContainer />
			<TooltipHelpComponent page='admin' />
			<div className='container-fluid'>
				<h2 style={titleStyle}>
					<FormattedMessage id='admin.panel' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='admin' helpTextId='help.admin.header'/>
					</div>
				</h2>
				<div className='row'>
					<div className='col-12 col-lg-6'>
						<PreferencesContainer />
					</div>
					<div className='col-12 col-lg-6'>
						<AddReadingsContainer />
						<div style={divMarginTop}>
							<AddMetersContainer />
						</div>
					</div>
				</div>
			</div>
			<FooterContainer />
		</div>
	);
}
