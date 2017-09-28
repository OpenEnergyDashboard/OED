/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This component is the main page of the edit group page.
import React from 'react';
import { FormControl, Button } from 'react-bootstrap';

export default class EditGroupsComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			name: this.props.name
		};
		this.handleNameChange = this.handleNameChange.bind(this);
		this.handleEditGroup = this.handleEditGroup.bind(this);
		this.handleDeleteGroup = this.handleDeleteGroup.bind(this);
		this.handleReturnToView = this.handleReturnToView.bind(this);
	}

	handleNameChange(e) {
		const name = e.target.value;
		this.setState({ name });
		this.props.editGroupName(name);
	}

	handleEditGroup() {
		this.props.submitGroupInEditingIfNeeded();
		this.props.changeDisplayMode('view');
	}

	handleDeleteGroup() {
		// TODO call delete group action
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
				<FormControl type="text" placeholder="Name" value={this.state.name} onChange={this.handleNameChange} />
				<br />
				<div className="row">
					<div className="col-xs-6">
						<p>Selected meters</p>
					</div>
					<div className="col-xs-6">
						<p>Other meters</p>
					</div>
				</div>
				<div className="row">
					<div className="col-xs-6">
						<p>Selected groups</p>
					</div>
					<div className="col-xs-6">
						<p>Other groups</p>
					</div>
				</div>
				<Button type="submit" onClick={this.handleEditGroup}>Submit changes</Button>
				<Button type="submit" onClick={this.handleDeleteGroup}>Delete group</Button>
				<Button className="pull-right" type="submit" onClick={this.handleReturnToView}>Return to groups overview</Button>
			</div>
		);
	}
}

