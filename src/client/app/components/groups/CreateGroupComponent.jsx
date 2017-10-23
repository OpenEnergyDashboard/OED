/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { FormControl, Button } from 'react-bootstrap';
import DatasourceBoxContainer from '../../containers/groups/DatasourceBoxContainer';

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
		this.props.changeDisplayModeToView();
	}

	render() {
		const divStyle = {
			paddingTop: '35px'
		};
		const divBottomStyle = {
			marginBottom: '20px'
		};
		const textStyle = {
			fontWeight: 'bold',
			margin: 0
		};
		const centerTextStyle = {
			textAlign: 'center'
		};
		return (
			<div style={divStyle} className="col-xs-6">
				<h3 style={centerTextStyle}>Create a New Group</h3>
				<div style={divBottomStyle}>
					<p style={textStyle}>Name:</p>
					<FormControl type="text" placeholder="Name" onChange={this.handleNameChange} />
				</div>
				<div style={divBottomStyle}>
					<p style={textStyle}>Select Meters:</p>
					<DatasourceBoxContainer type="meter" selection="all" />
				</div>
				<div style={divBottomStyle}>
					<p style={textStyle}>Select Groups:</p>
					<DatasourceBoxContainer type="group" selection="all" />
				</div>
				<Button type="submit" onClick={this.handleReturnToView}>Cancel</Button>
				<Button type="submit" className="pull-right" onClick={this.handleCreateGroup}>Create group</Button>
			</div>
		);
	}
}
