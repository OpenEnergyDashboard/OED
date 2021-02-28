/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';

interface VersionProps {
	version: string;
}

/**
 * React component that shows the version of OED currently running in the client
 */
export default class VersionComponent extends React.Component<VersionProps, {}> {
	constructor(props: VersionProps) {
		super(props);
	}

	public render() {
		return (
			<div>
				<FormattedMessage id='oed.version'/>
				{this.props.version}
			</div>
		);
	}
}

