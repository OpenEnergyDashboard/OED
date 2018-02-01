/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import _ from 'lodash';
import { Input, Button } from 'reactstrap';
import DatasourceBoxContainer from '../../containers/groups/DatasourceBoxContainer';

export default class EditGroupsComponent extends React.Component {
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
		return (
			<div className="row">
				<div style={divStyle} className="col-6">
					<h3 style={centerTextStyle}>Edit Group</h3>
					<p style={boldStyle}>Name:</p>
					<Input type="text" placeholder="Name" value={this.state.name} onChange={this.handleNameChange} />
					<div className="row" style={metersDivStyle}>
						<div className="col-5">
							<p style={boldStyle}>Child meters:</p>
							<DatasourceBoxContainer
								type="meter"
								selection="custom"
								datasource={this.props.childMeters}
								selectedOptions={this.state.defaultSelectedMeters}
								selectDatasource={this.handleUpdatedSelectedMeters}
							/>
						</div>
						<div className="col-2" style={leftRightButtonsDivStyle}>
							<Button outline onClick={this.handleMoveUnusedMetersToChildMeters} style={leftRightButtonStyle}>
								<i className="fa fa-chevron-left" />
							</Button>
							<Button outline onClick={this.handleMoveChildMetersToUnusedMeters} style={leftRightButtonStyle}>
								<i className="fa fa-chevron-right" />
							</Button>
						</div>
						<div className="col-5">
							<p style={boldStyle}>Unused meters:</p>
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
						<div className="col-5">
							<p style={boldStyle}>Child groups:</p>
							<DatasourceBoxContainer
								type="group"
								selection="custom"
								datasource={this.props.childGroups}
								selectedOptions={this.state.defaultSelectedGroups}
								selectDatasource={this.handleUpdateSelectedGroups}
							/>
						</div>
						<div className="col-2" style={leftRightButtonsDivStyle}>
							<Button outline onClick={this.handleMoveUnusedGroupsToChildGroups} style={leftRightButtonStyle}>
								<i className="fa fa-chevron-left" />
							</Button>
							<Button outline onClick={this.handleMoveChildGroupsToUnusedGroups} style={leftRightButtonStyle}>
								<i className="fa fa-chevron-right" />
							</Button>
						</div>
						<div className="col-5">
							<p style={boldStyle}>Unused groups:</p>
							<DatasourceBoxContainer
								type="group"
								selection="custom"
								datasource={this.props.allGroupsExceptChildGroups}
								selectedOptions={this.state.defaultUnusedGroups}
								selectDatasource={this.handleUpdateUnusedGroups}
							/>
						</div>
					</div>
					<div className="row">
						<div className="col-6">
							<Button outline onClick={this.handleReturnToView}>Cancel</Button>
							<Button outline onClick={this.handleEditGroup}>Submit changes</Button>
						</div>
						<div className="col-6 d-flex justify-content-end">
							<Button outline className="justify-content-end" onClick={this.handleDeleteGroup}>Delete group</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
