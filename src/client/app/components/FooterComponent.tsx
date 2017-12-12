/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';

export default function FooterComponent() {
	const footerStyle: React.CSSProperties = {
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
		<div className='container-fluid'>
			<footer className='footer' style={footerStyle}>
				<span>Open Energy Dashboard is an open source project coordinated by Beloit College. <a href='mailto:oed@beloit.edu'>Contact us</a> or
					visit our <a target='_blank' rel='noopener noreferrer' href='https://openenergydashboard.github.io/'>website</a> for more information.</span>
			</footer>
		</div>
	);
}
