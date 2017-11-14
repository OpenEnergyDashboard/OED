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
		width: '100%',
		height: '1em'
	};
	const containerStyle = {
		//paddingTop: '2em'
	};

	return (
		<footer className="footer" style={footerStyle}>
			<div className="container" style={containerStyle}>
				<a href="mailto:oed@beloit.edu">Contact Us</a>
				<a href="https://github.com/beloitcollegecomputerscience/OED">Website</a>
			</div>
		</footer>
	);
}
