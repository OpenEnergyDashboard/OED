/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';

/**
 * React component that creates an logo image from a file path
 * @param props The props from the parent component which includes a showColoredLogo bool and the logoStateChanged dispatcher
 * @return JSX to create logo image
 */
export default function LogoComponent(props) {
	const imgStyle = {
		width: '136px',
		height: '90px',
		top: '10px',
		left: '30px',
		position: 'absolute'
	};

	// Display the appropriate logo
	const logoUrl = props.showColoredLogo ? './app/images/logo.png' : './app/images/logo_bw.png';

	return (
		<img
			src={logoUrl}
			alt="Logo"
			style={imgStyle}
			onMouseEnter={() => props.logoStateChanged(true)}
			onMouseOut={() => props.logoStateChanged(false)}
		/>
	);
}
