/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { injectIntl, InjectedIntlProps, defineMessages } from 'react-intl';

interface LogoProps {
	url: string;
}

type LogoPropsWithIntl = LogoProps & InjectedIntlProps;

/**
 * React component that creates an logo image from a file path
 * @param props The props from the parent component which includes a path url
 * @return JSX to create logo image
 */
function LogoComponent(props: LogoPropsWithIntl) {
	const imgStyle: React.CSSProperties = {
		maxWidth: '100%',
		height: 'auto',
		paddingTop: '10px'
	};
	const messages = defineMessages({
		oed: { id: 'oed' },
		logo: { id: 'logo' }
	});
	const { formatMessage } = props.intl;
	return (
		<img src={props.url} alt={formatMessage(messages.logo)} title={formatMessage(messages.oed)} style={imgStyle} />
	);
}

export default injectIntl<LogoProps>(LogoComponent);
