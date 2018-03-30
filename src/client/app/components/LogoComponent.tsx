/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';

interface LogoProps {
	url: string;
	height: number;
}

/**
 * React component that creates an logo image from a file path
 */
export default function LogoComponent(props: LogoProps) {
	return (
		<img height={props.height} src={props.url} alt='Logo' title='Open Energy Dashboard' />
	);
}
