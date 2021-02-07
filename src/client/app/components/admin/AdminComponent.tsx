/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import HeaderContainer from '../../containers/HeaderContainer';
import FooterComponent from '../FooterComponent';
import AddMetersContainer from '../../containers/admin/AddMetersContainer';
import AddReadingsContainer from '../../containers/admin/AddReadingsContainer';
import PreferencesContainer from '../../containers/admin/PreferencesContainer';
import TooltipHelpComponentAlternative from '../TooltipHelpComponentAlternative';

/**
 * Top-level React component that controls the home page
 * @return JSX to create the home page
 */

export default function AdminComponent() {
	const divMarginTop: React.CSSProperties = {
		marginTop: '50px'
	};
	return (
		<div>
			<HeaderContainer />
			<TooltipHelpComponentAlternative page='admin' />
			<div className='container-fluid'>
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
			<FooterComponent />
		</div>
	);
}


