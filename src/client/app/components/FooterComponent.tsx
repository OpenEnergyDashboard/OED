/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';

/**
 * React component that controls the footer strip at the bottom of all pages
 * @returns JSX code to render footer components.
 * TODO: confirm this.
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
					<a href='mailto:oed@beloit.edu'>
						<FormattedMessage id='contact.us' />
					</a>
					<FormattedMessage id='visit'/>
					<a target='_blank' rel='noopener noreferrer' href='https://openenergydashboard.github.io/'>
						<FormattedMessage id='website' />
					</a>
					<FormattedMessage id='info' />
				</span>
			</footer>
		</div>
	);
}
