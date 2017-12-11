/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'react-bootstrap';

export default class ChartLinkComponent extends React.Component {
	constructor(props) {
		super(props);
		this.toggleLink = this.toggleLink.bind(this);
		this.state = {
			showLink: false
		};
	}

	toggleLink() {
		this.setState({ showLink: !this.state.showLink });
	}

	render() {
		const wellStyle = {
			wordWrap: 'break-word',
			padding: '9px',
			minHeight: '20px',
			marginBottom: '20px',
			backgroundColor: '#f5f5f5',
			border: '1px solid #e3e3e3',

		};
		return (
			<div>
				<Button onClick={this.toggleLink}><FormattedMessage
					id="toggle.link"
					defaultMessage="Toggle chart link"
				/></Button>
				{this.state.showLink &&
					<div style={wellStyle}>
						{this.props.linkText}
					</div>
				}
			</div>
		);
	}
}
