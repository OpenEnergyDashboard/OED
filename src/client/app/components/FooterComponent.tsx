/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { versionApi } from '../utils/api';
import VersionComponent from './VersionComponent';


/**
 * React component that controls the footer strip at the bottom of all pages
 */
export default function FooterComponent() {
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
	let versionString = "";
	fetchVersion().then(function (result) {
		console.log("Second checkpoint");
		versionString = result;
		console.log(versionString);
	});
	console.log("Third checkpoint")
	console.log(versionString);
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
					<VersionComponent version={versionString}/>
				</span>
			</footer>
		</div>
	);
}

// async functions always return a promise
async function fetchVersion() {
	// the await call contains and relies on a promise already
	// await: if it succeeds, returns result, otherwise, throws error
	const versionPromise = await versionApi.getVersion();
	console.log("This is the version promise")
	console.log(versionPromise);
	return versionPromise;
}