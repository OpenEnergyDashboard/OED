/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';

/**
 * React component that creates an logo image from a file path
 * @param props The props from the parent component which includes a path url
 * @return JSX to create logo image
 */
export default function LogoComponent(props) {
	const imgStyle = {
		maxWidth: '100%',
		height: 'auto',
		paddingTop: '10px',
	};
	return (
		<img src={props.url} alt="Logo" title="Open Energy Dashboard" style={imgStyle} />
	);
}
