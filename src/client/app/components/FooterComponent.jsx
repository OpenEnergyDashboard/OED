/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';

/**
 * React component that controls the footer strip at the bottom of all pages
 */
export default function FooterComponent() {
	const footerStyle = {
		position: 'absolute',
		bottom: '30px',
		height: '10px',
		lineHeight: '10px',
		paddingTop: '20px',
		borderTop: '1px #e1e4e8 solid',
		textAlign: 'center',
		width: '100%'
	};
	const phantomStyle = {
		display: 'block',
		height: '60px',
		width: '100%',
	};
	return (
		<div>
			<div style={phantomStyle} />
			<footer className="footer" style={footerStyle}>
				<span>Open Energy Dashboard is an open source project coordinated by Beloit College. <a href="mailto:oed@beloit.edu">Contact us</a> or
					visit our <a target="_blank" rel="noopener noreferrer" href="https://openenergydashboard.github.io/">website</a> for more information.</span>
			</footer>
		</div>
	);
}
