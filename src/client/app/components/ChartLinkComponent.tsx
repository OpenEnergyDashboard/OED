/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';

/*
 * Establishes text for chart links.
 */
interface ChartLinkProps {
	linkText: string;
}

/**
 * The type used to represent the state of a ChartLinkComponent.
 * showLink: whether the link is visible or not.
 */
interface ChartLinkState {
	showLink: boolean;
}

export default class ChartLinkComponent extends React.Component<ChartLinkProps, ChartLinkState> {
	constructor(props: ChartLinkProps) {
		super(props);
		this.toggleLink = this.toggleLink.bind(this);
		this.state = {
			showLink: false
		};
	}
	
	public render() {
		const wellStyle: React.CSSProperties = {
			wordWrap: 'break-word',
			padding: '9px',
			minHeight: '20px',
			marginBottom: '20px',
			backgroundColor: '#f5f5f5',
			border: '1px solid #e3e3e3'

		};
		return (
			<div>
				<Button	outline	onClick={this.toggleLink}>
					<FormattedMessage id='toggle.link' />
				</Button>
				{this.state.showLink &&
					<div style={wellStyle}>
						{this.props.linkText}
					</div>
				}
			</div>
		);
	}
	
	/*
	 * Inverts whether link is displayed (is visible).
	 * TODO: confirm this
	 */
	private toggleLink() {
		this.setState({ showLink: !this.state.showLink });
	}
}
