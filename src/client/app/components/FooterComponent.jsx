/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';


/**
 * React component that controls the footer strip at the bottom of all pages
 * @param props The props passed down by the parent component
 * @return JSX to create the footer
 */
export default function FooterComponent() {
	const footerStyle = {
		position: 'absolute',
		bottom: '1em',
		paddingTop: '1em',
		paddingLeft: '.5em',
		paddingRight: '.5em',
		borderTop: '1px #e1e4e8 solid',
		color: '#999',
		textAlign: 'center',
		width: '98%'
	};


	return (
		<div className="container-fluid">
			<footer className="footer" style={footerStyle}>
				<span>Open Energy Dashboard is an open source project coordinated by Beloit College. <a target="_blank" rel="noopener noreferrer" href="mailto:oed@beloit.edu">Contact us</a> or
					visit our <a href="https://github.com/beloitcollegecomputerscience/OED">website</a> for more information.</span>
			</footer>
		</div>
	);
}
