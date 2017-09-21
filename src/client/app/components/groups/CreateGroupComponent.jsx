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
		this.handleNameChange = this.handleNameChange.bind(this);
		this.handleCreateGroup = this.handleCreateGroup.bind(this);
		this.handleReturnToView = this.handleReturnToView.bind(this);
	}

	componentWillMount() {
		this.props.createNewBlankGroup();
	}

	handleNameChange(e) {
		this.props.editGroupName(e.target.value);
	}

	handleCreateGroup() {
		this.props.submitGroupInEditingIfNeeded();
	}

	handleReturnToView() {
		this.props.changeDisplayMode('view');
	}

	render() {
		const divStyle = {
			paddingTop: '35px'
		};
		const underlineStyle = {
			textDecoration: 'underline'
		};
		const centerTextStyle = {
			textAlign: 'center'
		};
		return (
			<div style={divStyle} className="col-xs-6">
				<h3 style={centerTextStyle}>Create a New Group</h3>
				<p style={underlineStyle}>Name:</p>
				<FormControl type="text" placeholder="Name" onChange={this.handleNameChange} />
				<br />
				<MeterBoxContainer />
				<GroupBoxContainer />
				<Button type="submit" onClick={this.handleCreateGroup}>Create group</Button>
				<Button className="pull-right" type="submit" onClick={this.handleReturnToView}>Return to groups overview</Button>
			</div>
		);
	}
}
