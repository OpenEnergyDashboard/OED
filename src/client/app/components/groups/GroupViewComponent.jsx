/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { Button } from 'reactstrap';
import ListDisplayComponent from '../ListDisplayComponent';

export default class GroupViewComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleEditGroup = this.handleEditGroup.bind(this);
	}

	componentWillMount() {
		this.props.fetchGroupChildren(this.props.id);
	}

	handleEditGroup() {
		this.props.changeDisplayModeToEdit();
		this.props.beginEditingIfPossible(this.props.id);
	}

	render() {
		const nameStyle = {
			textAlign: 'center'
		};
		const buttonPadding = {
			marginTop: '10px'
		};
		const boldStyle = {
			fontWeight: 'bold',
			margin: 0
		};
		return (
			<div>
				<h2 style={nameStyle}>{this.props.name}</h2>
				<div className="row">
					<div className="col-6">
						<p style={boldStyle}>Child Meters:</p>
						<ListDisplayComponent items={this.props.childMeters} />
					</div>
					<div className="col-6">
						<p style={boldStyle}>Child Groups:</p>
						<ListDisplayComponent items={this.props.childGroups} />
					</div>
				</div>
				<Button style={buttonPadding} outline onClick={this.handleEditGroup}>Edit group</Button>
			</div>
		);
	}
}
