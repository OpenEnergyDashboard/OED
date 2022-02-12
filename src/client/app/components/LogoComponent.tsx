/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { defineMessages, useIntl } from 'react-intl';

interface LogoProps {
	url: string;
	height: number;
}

/**
 * React component that creates an logo image from a file path
 */
function LogoComponent(props: LogoProps) {
	const imgStyle: React.CSSProperties = {
		maxWidth: '100%',
		height: 'auto',
		paddingTop: '10px'
	};
	const messages = defineMessages({
		oed: { id: 'oed' },
		logo: { id: 'logo' }
	});
	// WrappedComponentProps doesn't really work here as it's a function, so instead we use useIntl() which was part of the updated react-intl
	const intl = useIntl();
	return (
		<img height={props.height} src={props.url} alt={intl.formatMessage(messages.logo)} title={intl.formatMessage(messages.oed)} style={imgStyle} />
	);
}

export default LogoComponent;
