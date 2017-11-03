/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import * as VERSION from '../../../common/version';

/**
 * React component that creates an logo image from a file path
 * @param props The props from the parent component which includes a path url
 * @return JSX to create logo image
 */
export default function LogoComponent(props) {
	const imgStyle = {
		maxWidth: '100%',
		height: 'auto',
		top: '10px',
		// left: '30px',
		position: 'absolute'
	};
	return (
		<img src={props.url} alt="Logo" title={`Open Energy Dashboard ${VERSION}`} style={imgStyle} />
	);
}
