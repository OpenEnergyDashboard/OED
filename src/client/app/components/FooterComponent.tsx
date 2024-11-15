/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { selectOEDVersion } from '../redux/api/versionApi';
import { useAppSelector } from '../redux/reduxHooks';

/**
 *
 * @returns Footer loaded at the bottom of every webpage, which loads the site version from the redux store
 */
export default function FooterComponent() {
	const version = useAppSelector(selectOEDVersion);
	return (
		<div id='footer' style={footerStyle}>
			<FormattedMessage id='oed.description' />
			<a href='https://OpenEnergyDashboard.org/contact/'>
				<FormattedMessage id='contact.us' />
			</a>
			<FormattedMessage id='visit' />
			<a target='_blank' rel='noopener noreferrer' href='https://openenergydashboard.org/'>
				<FormattedMessage id='website' />
			</a>
			<FormattedMessage id='info' />
			<FormattedMessage id='oed.version' />
			{version}
			.
		</div>
	);
}


const footerStyle: React.CSSProperties = {
	borderTop: '1px #e1e4e8 solid',
	padding: '10px 0px',
	textAlign: 'center',
	width: '100%'
};
