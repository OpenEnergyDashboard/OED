/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { selectOEDVersion } from '../redux/api/versionApi';
import { useAppSelector } from '../redux/hooks';

/**
 *
 * @returns Footer loaded at the bottom of every webpage, which loads the site version from the redux store
 */
export default function FooterComponent() {
	const version = useAppSelector(selectOEDVersion)
	return (
		<div>
			<div style={phantomStyle} />
			<footer className='footer' style={footerStyle}>
				<span>
					<FormattedMessage id='oed.description' />
					<a href='mailto:info@OpenEnergyDashboard.org'>
						<FormattedMessage id='contact.us' />
					</a>
					<FormattedMessage id='visit' />
					<a target='_blank' rel='noopener noreferrer' href='https://openenergydashboard.github.io/'>
						<FormattedMessage id='website' />
					</a>
					<FormattedMessage id='info' />
					<FormattedMessage id='oed.version' />
				</span>
				<span>{version}</span>
			</footer>
		</div>
	)
}


const footerStyle: React.CSSProperties = {
	position: 'absolute',
	bottom: '60px',
	height: '10px',
	lineHeight: '20px',
	paddingTop: '20px',
	borderTop: '1px #e1e4e8 solid',
	textAlign: 'center',
	width: '100%'
};
const phantomStyle: React.CSSProperties = {
	display: 'block',
	height: '100px',
	width: '100%'
};