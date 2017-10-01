/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This component is the main page of the edit group page.
import React from 'react';
import _ from 'lodash';
import { FormControl, Button, Glyphicon } from 'react-bootstrap';
import DatasourceBoxContainer from '../../containers/groups/DatasourceBoxContainer';

export default class EditGroupsComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			name: this.props.name,
			selectedMeters: [],
			unusedMeters: [],
			selectedGroups: [],
			unusedGroups: []
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
		this.props.changeChildMeters(_.difference(this.props.childMeters, this.state.selectedMeters));
		this.setState({ selectedMeters: [] });
	}

	handleMoveUnusedMetersToChildMeters() {
		this.props.changeChildMeters(_.union(this.props.childMeters, this.state.unusedMeters));
		this.setState({ unusedMeters: [] });
	}

	handleMoveChildGroupsToUnusedGroups() {
		this.props.changeChildGroups(_.difference(this.props.childGroups, this.state.selectedGroups));
		this.setState({ selectedGroups: [] });
	}

	handleMoveUnusedGroupsToChildGroups() {
		this.props.changeChildGroups(_.union(this.props.childGroups, this.state.unusedGroups));
		this.setState({ unusedGroups: [] });
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
				<h3 style={centerTextStyle}>Edit Group</h3>
				<p style={underlineStyle}>Name:</p>
				<FormControl type="text" placeholder="Name" value={this.state.name} onChange={this.handleNameChange} />
				<br />
				<div className="row">
					<div className="col-xs-5">
						<p>Selected meters</p>
						<DatasourceBoxContainer
							type="meter"
							selection="custom"
							datasource={this.props.childMeters}
							selectDatasource={this.handleUpdatedSelectedMeters}
						/>
					</div>
					<div className="col-xs-2">
						<Button onClick={this.handleMoveUnusedMetersToChildMeters}>
							<Glyphicon glyph="chevron-left" />
						</Button>
						<Button onClick={this.handleMoveChildMetersToUnusedMeters}>
							<Glyphicon glyph="chevron-right" />
						</Button>
					</div>
					<div className="col-xs-5">
						<p>Unused meters</p>
						<DatasourceBoxContainer
							type="meter"
							selection="custom"
							datasource={this.props.allMetersExceptChildMeters}
							selectDatasource={this.handleUpdateUnusedMeters}
						/>
					</div>
				</div>
				<div className="row">
					<div className="col-xs-5">
						<p>Selected groups</p>
						<DatasourceBoxContainer
							type="group"
							selection="custom"
							datasource={this.props.childGroups}
							selectDatasource={this.handleUpdateSelectedGroups}
						/>
					</div>
					<div className="col-xs-2">
						<Button onClick={this.handleMoveUnusedGroupsToChildGroups}>
							<Glyphicon glyph="chevron-left" />
						</Button>
						<Button onClick={this.handleMoveChildGroupsToUnusedGroups}>
							<Glyphicon glyph="chevron-right" />
						</Button>
					</div>
					<div className="col-xs-5">
						<p>Unused groups</p>
						<DatasourceBoxContainer
							type="group"
							selection="custom"
							datasource={this.props.allGroupsExceptChildGroups}
							selectDatasource={this.handleUpdateUnusedGroups}
						/>
					</div>
				</div>
				<br />
				<Button type="submit" onClick={this.handleEditGroup}>Submit changes</Button>
				<Button type="submit" onClick={this.handleDeleteGroup}>Delete group</Button>
				<Button className="pull-right" type="submit" onClick={this.handleReturnToView}>Return to groups overview</Button>
			</div>
		);
	}
}

