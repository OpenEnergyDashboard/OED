/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { FormControl } from 'react-bootstrap';
import HeaderContainer from '../containers/HeaderContainer';

export default class AdminComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleTitleChange = this.handleTitleChange.bind(this);
	}

	handleTitleChange(e) {
		this.props.updateTitle(e.target.value);
	}

	render() {
		return (
			<div>
				<HeaderContainer renderLoginButton={false} renderOptionsButton={false} renderAdminButton={false} />
				<FormControl type="text" placeholder="Name" value={this.props.title} onChange={this.handleTitleChange} />
			</div>
		);
	}
}
