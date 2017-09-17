/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { FormControl, Button } from 'react-bootstrap';
import MeterBoxContainer from '../../containers/groups/MeterBoxContainer';
import GroupBoxContainer from '../../containers/groups/GroupBoxContainer';

export default class CreateGroupComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			name: ''
		};
		this.handleNameChange = this.handleNameChange.bind(this);
	}

	handleNameChange(e) {
		this.setState({ name: e.target.value });
	}

	render() {
		const divStyle = {
			paddingTop: '35px'
		};
		const underlineStyle = {
			textDecoration: 'underline'
		};
		return (
			<div style={divStyle} className="col-xs-6">
				<h3>Create a new group</h3>
				<p style={underlineStyle}>Name</p>
				<FormControl type="text" placeholder="Name" onChange={this.handleNameChange} />
				<MeterBoxContainer />
				<GroupBoxContainer />
				<Button type="submit">Create group</Button>
			</div>
		);
	}
}
