/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This component is the main page of the edit group page.
import React from 'react';
import { defineMessages, injectIntl, intlShape, FormattedMessage } from 'react-intl';
import _ from 'lodash';
import { FormControl, Button, Glyphicon } from 'react-bootstrap';
import DatasourceBoxContainer from '../../containers/groups/DatasourceBoxContainer';

class EditGroupsComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			name: this.props.name,
			selectedMeters: [],
			defaultSelectedMeters: [],
			unusedMeters: [],
			defaultUnusedMeters: [],
			selectedGroups: [],
			defaultSelectedGroups: [],
			unusedGroups: [],
			defaultUnusedGroups: []
		};
		this.handleNameChange = this.handleNameChange.bind(this);
		this.handleUpdatedSelectedMeters = this.handleUpdatedSelectedMeters.bind(this);
		this.handleUpdateUnusedMeters = this.handleUpdateUnusedMeters.bind(this);
		this.handleUpdateSelectedGroups = this.handleUpdateSelectedGroups.bind(this);
		this.handleUpdateUnusedGroups = this.handleUpdateUnusedGroups.bind(this);
		this.handleMoveChildMetersToUnusedMeters = this.handleMoveChildMetersToUnusedMeters.bind(this);
		this.handleMoveUnusedMetersToChildMeters = this.handleMoveUnusedMetersToChildMeters.bind(this);
		this.handleMoveChildGroupsToUnusedGroups = this.handleMoveChildGroupsToUnusedGroups.bind(this);
		this.handleMoveUnusedGroupsToChildGroups = this.handleMoveUnusedGroupsToChildGroups.bind(this);
		this.handleEditGroup = this.handleEditGroup.bind(this);
		this.handleDeleteGroup = this.handleDeleteGroup.bind(this);
		this.handleReturnToView = this.handleReturnToView.bind(this);
	}

	handleNameChange(e) {
		const name = e.target.value;
		this.setState({ name });
		this.props.editGroupName(name);
	}

	handleUpdatedSelectedMeters(selectedMeters) {
		this.setState({ selectedMeters });
	}

	handleUpdateUnusedMeters(unusedMeters) {
		this.setState({ unusedMeters });
	}

	handleUpdateSelectedGroups(selectedGroups) {
		this.setState({ selectedGroups });
	}

	handleUpdateUnusedGroups(unusedGroups) {
		this.setState({ unusedGroups });
	}

	handleMoveChildMetersToUnusedMeters() {
		this.props.changeChildMeters(_.difference(this.props.childMeters.map(meter => meter.id), this.state.selectedMeters));
		this.setState({ selectedMeters: [], defaultSelectedMeters: [] });
	}

	handleMoveUnusedMetersToChildMeters() {
		this.props.changeChildMeters(_.union(this.props.childMeters.map(meter => meter.id), this.state.unusedMeters));
		this.setState({ unusedMeters: [], defaultUnusedMeters: [] });
	}

	handleMoveChildGroupsToUnusedGroups() {
		this.props.changeChildGroups(_.difference(this.props.childGroups.map(group => group.id), this.state.selectedGroups));
		this.setState({ selectedGroups: [], defaultSelectedGroups: [] });
	}

	handleMoveUnusedGroupsToChildGroups() {
		this.props.changeChildGroups(_.union(this.props.childGroups.map(group => group.id), this.state.unusedGroups));
		this.setState({ unusedGroups: [], defaultUnusedGroups: [] });
	}

	handleEditGroup() {
		this.props.submitGroupInEditingIfNeeded();
	}

	handleDeleteGroup() {
		this.props.deleteGroup();
	}

	handleReturnToView() {
		this.props.changeDisplayModeToView();
	}

	render() {
		const divStyle = {
			paddingTop: '35px'
		};
		const metersDivStyle = {
			marginTop: '10px',
			marginBottom: '20px'
		};
		const groupsDivStyle = {
			marginBottom: '10px'
		};
		const leftRightButtonsDivStyle = {
			marginTop: '25px'
		};
		const leftRightButtonStyle = {
			width: '50%',
			margin: '0 auto'
		};
		const boldStyle = {
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
					id="edit.group"
					defaultMessage="Edit Group"
				/></h3>
				<p style={boldStyle}><FormattedMessage
					id="name:"
					defaultMessage="Name:"
				/></p>
				<FormControl type="text" placeholder={formatMessage(messages.name)} value={this.state.name} onChange={this.handleNameChange} />
				<div className="row" style={metersDivStyle}>
					<div className="col-xs-5">
						<p style={boldStyle}><FormattedMessage
							id="child.meters"
							defaultMessage="Child Meters:"
						/></p>
						<DatasourceBoxContainer
							type="meter"
							selection="custom"
							datasource={this.props.childMeters}
							selectedOptions={this.state.defaultSelectedMeters}
							selectDatasource={this.handleUpdatedSelectedMeters}
						/>
					</div>
					<div className="col-xs-2" style={leftRightButtonsDivStyle}>
						<Button onClick={this.handleMoveUnusedMetersToChildMeters} style={leftRightButtonStyle}>
							<Glyphicon glyph="chevron-left" />
						</Button>
						<Button onClick={this.handleMoveChildMetersToUnusedMeters} style={leftRightButtonStyle}>
							<Glyphicon glyph="chevron-right" />
						</Button>
					</div>
					<div className="col-xs-5">
						<p style={boldStyle}><FormattedMessage
							id="unused.meters"
							defaultMessage="Unused Meters:"
						/></p>
						<DatasourceBoxContainer
							type="meter"
							selection="custom"
							datasource={this.props.allMetersExceptChildMeters}
							selectedOptions={this.state.defaultUnusedMeters}
							selectDatasource={this.handleUpdateUnusedMeters}
						/>
					</div>
				</div>
				<div className="row" style={groupsDivStyle}>
					<div className="col-xs-5">
						<p style={boldStyle}><FormattedMessage
							id="child.groups"
							defaultMessage="Child Groups:"
						/></p>
						<DatasourceBoxContainer
							type="group"
							selection="custom"
							datasource={this.props.childGroups}
							selectedOptions={this.state.defaultSelectedGroups}
							selectDatasource={this.handleUpdateSelectedGroups}
						/>
					</div>
					<div className="col-xs-2" style={leftRightButtonsDivStyle}>
						<Button onClick={this.handleMoveUnusedGroupsToChildGroups} style={leftRightButtonStyle}>
							<Glyphicon glyph="chevron-left" />
						</Button>
						<Button onClick={this.handleMoveChildGroupsToUnusedGroups} style={leftRightButtonStyle}>
							<Glyphicon glyph="chevron-right" />
						</Button>
					</div>
					<div className="col-xs-5">
						<p style={boldStyle}><FormattedMessage
							id="unused.groups"
							defaultMessage="Unused Groups:"
						/></p>
						<DatasourceBoxContainer
							type="group"
							selection="custom"
							datasource={this.props.allGroupsExceptChildGroups}
							selectedOptions={this.state.defaultUnusedGroups}
							selectDatasource={this.handleUpdateUnusedGroups}
						/>
					</div>
				</div>
				<Button type="submit" onClick={this.handleReturnToView}><FormattedMessage
					id="cancel"
					defaultMessage="Cancel"
				/></Button>
				<Button type="submit" onClick={this.handleEditGroup}><FormattedMessage
					id="submit.changes"
					defaultMessage="Submit changes"
				/></Button>
				<Button className="pull-right" type="submit" onClick={this.handleDeleteGroup}><FormattedMessage
					id="delete.group"
					defaultMessage="Delete group"
				/></Button>
			</div>
		);
	}
}
EditGroupsComponent.propTypes = {
	intl: intlShape.isRequired
};

export default injectIntl(EditGroupsComponent);
