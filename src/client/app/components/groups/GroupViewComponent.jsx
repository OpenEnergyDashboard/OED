/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'react-bootstrap';
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
					<div className="col-xs-6">
						<p style={boldStyle}><FormattedMessage
							id="child.meters"
							defaultMessage="Child Meters:"
						/></p>
						<ListDisplayComponent items={this.props.childMeters} />
					</div>
					<div className="col-xs-6">
						<p style={boldStyle}><FormattedMessage
							id="child.groups"
							defaultMessage="Child Groups:"
						/></p>
						<ListDisplayComponent items={this.props.childGroups} />
					</div>
				</div>
				<Button style={buttonPadding} bsStyle="default" onClick={this.handleEditGroup}><FormattedMessage
					id="edit.group"
					defaultMessage="Edit group"
				/></Button>
			</div>
		);
	}
}
