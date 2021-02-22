/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
//import VERSION from '../../../server/version';
import { versionApi } from '../utils/api';


/**
 * React component that controls the footer strip at the bottom of all pages
 */
export default function FooterComponent() {
	const footerStyle: React.CSSProperties = {
		position: 'absolute',
		bottom: '30px',
		height: '10px',
		lineHeight: '10px',
		paddingTop: '20px',
		borderTop: '1px #e1e4e8 solid',
		textAlign: 'center',
		width: '100%'
	};
	const phantomStyle: React.CSSProperties = {
		display: 'block',
		height: '60px',
		width: '100%'
	};
	return (
		<div>
			<div style={phantomStyle} />
			<footer className='footer' style={footerStyle}>
				<span>
					<FormattedMessage id='oed.description' />
					<a href='mailto:info@OpenEnergyDashboard.org'>
						<FormattedMessage id='contact.us' />
					</a>
					<FormattedMessage id='visit'/>
					<a target='_blank' rel='noopener noreferrer' href='https://openenergydashboard.github.io/'>
						<FormattedMessage id='website' />
					</a>
					<FormattedMessage id='info' />
					<FormattedMessage id='oed.version'/> <span id="myspan"> 0.0.0 </span>
				</span>
			</footer>
		</div>
	);
}

async function getVersion() {
    try {
		const versionObj = await versionApi.getVersion();
        const version = versionObj.toString();
		console.log("VERSIONNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN");
		console.log(version);
    }
    catch(err) {
        console.log('Error: ', err.message);
    }
}