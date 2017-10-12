/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { Button } from 'react-bootstrap';
import DatasourceBoxContainer from '../../containers/groups/DatasourceBoxContainer';

export default class GroupViewComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleEditGroup = this.handleEditGroup.bind(this);
	}

	componentWillMount() {
		this.props.fetchGroupChildren(this.props.id);
	}

	handleEditGroup() {
		this.props.changeDisplayMode('edit');
		this.props.beginEditingIfPossible(this.props.id);
	}

	render() {
		const nameStyle = {
			textAlign: 'center'
		};
		const buttonPadding = {
			marginTop: '10px'
		};
		const underlineStyle = {
			textDecoration: 'underline'
		};
		return (
			<div>
				<h2 style={nameStyle}>{this.props.name}</h2>
				<div className="row">
					<div className="col-xs-6">
						<p style={underlineStyle}>Child meters:</p>
						<DatasourceBoxContainer type="meter" selection="children" parentID={this.props.id} />
					</div>
					<div className="col-xs-6">
						<p style={underlineStyle}>Child groups:</p>
						<DatasourceBoxContainer type="group" selection="children" parentID={this.props.id} />
					</div>
				</div>
				<Button style={buttonPadding} bsStyle="default" onClick={this.handleEditGroup}>Edit group</Button>
			</div>
		);
	}
}
