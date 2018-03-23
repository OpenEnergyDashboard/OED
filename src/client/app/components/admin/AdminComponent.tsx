/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import HeaderContainer from '../../containers/HeaderContainer';
import FooterComponent from '../FooterComponent';
import AddMeterContainer from '../../containers/admin/AddMetersContainer';
import AddReadingsContainer from '../../containers/admin/AddReadingsContainer';
import PreferencesContainer from '../../containers/admin/PreferencesContainer';

/**
 * Top-level React component that controls the home page
 * @return JSX to create the home page
 */

export default function AdminComponent() {
	return (
		<div>
			<HeaderContainer />
			<div className='container-fluid'>
				<div className='row'>
					<div className='col-12 col-lg-6'>
						<PreferencesContainer />
					</div>
					<div className='col-12 col-lg-6'>
						<AddReadingsContainer />
						<AddMeterContainer />
					</div>
				</div>
			</div>
			<FooterComponent />
		</div>
	);
}


