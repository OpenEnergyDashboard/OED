/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';

/**
 * React component that displays a 404 Not Found error page
 * @return JSX to create the 404 Not Found error page
 */
export default function NotFoundComponent() {
	const textStyle = {
		fontWeight: 'bold',
		paddingLeft: '15px'
	};
	return (
		<h1 style={textStyle}>404 Not Found</h1>
	);
}
