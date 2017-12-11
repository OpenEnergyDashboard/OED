/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { defineMessages, injectIntl, intlShape, FormattedMessage } from 'react-intl';
import { FormControl, Button } from 'react-bootstrap';
import DatasourceBoxContainer from '../../containers/groups/DatasourceBoxContainer';

class CreateGroupComponent extends React.Component {
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
		const messages = defineMessages({
			name: {
				id: 'name',
				defaultMessage: 'Name'
			}
		});
		const { formatMessage } = this.props.intl;
		return (
			<div style={divStyle} className="col-xs-6">
				<h3 style={centerTextStyle}><FormattedMessage
					id="create.new.group"
					defaultMessage="Create a New Group"
				/></h3>
				<div style={divBottomStyle}>
					<p style={textStyle}><FormattedMessage
						id="name:"
						defaultMessage="Name:"
					/></p>
					<FormControl type="text" placeholder={formatMessage(messages.name)} onChange={this.handleNameChange} />
				</div>
				<div style={divBottomStyle}>
					<p style={textStyle}><FormattedMessage
						id="meters.select"
						defaultMessage="Select Meters:"
					/></p>
					<DatasourceBoxContainer type="meter" selection="all" />
				</div>
				<div style={divBottomStyle}>
					<p style={textStyle}><FormattedMessage
						id="groups.select"
						defaultMessage="Select Groups:"
					/></p>
					<DatasourceBoxContainer type="group" selection="all" />
				</div>
				<Button type="submit" onClick={this.handleReturnToView}><FormattedMessage
					id="cancel"
					defaultMessage="Cancel"
				/></Button>
				<Button type="submit" className="pull-right" onClick={this.handleCreateGroup}><FormattedMessage
					id="create.group"
					defaultMessage="Create Group"
				/></Button>
			</div>
		);
	}
}
CreateGroupComponent.propTypes = {
	intl: intlShape.isRequired
};

export default injectIntl(CreateGroupComponent);
