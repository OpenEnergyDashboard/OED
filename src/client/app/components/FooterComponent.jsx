/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';


/**
 * React component that controls the footer strip at the bottom of all pages
 * @return JSX to create the footer
 */
export default function FooterComponent() {
	const footerStyle = {
		position: 'fixed',
		bottom: '1em',
		paddingTop: '1em',
		paddingLeft: '.5em',
		paddingRight: '.5em',
		borderTop: '1px #e1e4e8 solid',
		textAlign: 'center',
		width: '100%'
	};


	return (
		<div className="container-fluid">
			<footer className="footer" style={footerStyle}>
				<span>Open Energy Dashboard is an open source project coordinated by Beloit College. <a href="mailto:oed@beloit.edu">Contact us</a> or
					visit our <a target="_blank" rel="noopener noreferrer" href="https://openenergydashboard.github.io/">website</a> for more information.</span>
			</footer>
		</div>
	);
}
