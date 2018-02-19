/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This component is the main page of the edit group page.
// TYPESCRIPT TODO: I have insufficient domain knowledge to edit this.
import * as React from 'react';
import * as _ from 'lodash';
import { Input, Button } from 'reactstrap';
import DatasourceBoxContainer from '../../containers/groups/DatasourceBoxContainer';
import { NamedIDItem } from '../../types/items';
import { SelectionType } from '../../containers/groups/DatasourceBoxContainer';
import { EditGroupNameAction, ChangeDisplayModeAction, ChangeChildMetersAction, ChangeChildGroupsAction } from '../../types/redux/groups';

interface EditGroupsProps {
	name: string;
	childMeters: NamedIDItem[];
	childGroups: NamedIDItem[];
	allMetersExceptChildMeters: NamedIDItem[];
	allGroupsExceptChildGroups: NamedIDItem[];
	submitGroupInEditingIfNeeded(): Promise<any>;
	deleteGroup(): Promise<any>;
	changeDisplayModeToView(): ChangeDisplayModeAction;
	editGroupName(name: string): EditGroupNameAction;
	changeChildMeters(selected: number[]): ChangeChildMetersAction;
	changeChildGroups(selected: number[]): ChangeChildGroupsAction;
}

interface EditGroupsState {
	name: string;
	selectedMeters: number[];
	defaultSelectedMeters: NamedIDItem[];
	unusedMeters: number[];
	defaultUnusedMeters: NamedIDItem[];
	selectedGroups: number[];
	defaultSelectedGroups: NamedIDItem[];
	unusedGroups: number[];
	defaultUnusedGroups: NamedIDItem[];
}

export default class EditGroupsComponent extends React.Component<EditGroupsProps, EditGroupsState> {
	constructor(props: EditGroupsProps) {
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



	public render() {
		const divStyle: React.CSSProperties = {
			paddingTop: '35px'
		};
		const metersDivStyle: React.CSSProperties = {
			marginTop: '10px',
			marginBottom: '20px'
		};
		const groupsDivStyle: React.CSSProperties = {
			marginBottom: '10px'
		};
		const leftRightButtonsDivStyle: React.CSSProperties = {
			marginTop: '25px'
		};
		const leftRightButtonStyle: React.CSSProperties = {
			width: '50%',
			margin: '0 auto'
		};
		const boldStyle: React.CSSProperties = {
			fontWeight: 'bold',
			margin: 0
		};
		const centerTextStyle: React.CSSProperties = {
			textAlign: 'center'
		};
		return (
			<div className='row'>
				<div style={divStyle} className='col-6'>
					<h3 style={centerTextStyle}>Edit Group</h3>
					<p style={boldStyle}>Name:</p>
					<Input type='text' placeholder='Name' value={this.state.name} onChange={this.handleNameChange} />
					<div className='row' style={metersDivStyle}>
						<div className='col-5'>
							<p style={boldStyle}>Child meters:</p>
							<DatasourceBoxContainer
								type='meter'
								selection={SelectionType.Custom}
								datasource={this.props.childMeters}
								selectedOptions={this.state.defaultSelectedMeters}
								selectDatasource={this.handleUpdatedSelectedMeters}
							/>
						</div>
						<div className='col-2' style={leftRightButtonsDivStyle}>
							<Button outline onClick={this.handleMoveUnusedMetersToChildMeters} style={leftRightButtonStyle}>
								<i className='fa fa-chevron-left' />
							</Button>
							<Button outline onClick={this.handleMoveChildMetersToUnusedMeters} style={leftRightButtonStyle}>
								<i className='fa fa-chevron-right' />
							</Button>
						</div>
						<div className='col-5'>
							<p style={boldStyle}>Unused meters:</p>
							<DatasourceBoxContainer
								type='meter'
								selection={SelectionType.Custom}
								datasource={this.props.allMetersExceptChildMeters}
								selectedOptions={this.state.defaultUnusedMeters}
								selectDatasource={this.handleUpdateUnusedMeters}
							/>
						</div>
					</div>
					<div className='row' style={groupsDivStyle}>
						<div className='col-5'>
							<p style={boldStyle}>Child groups:</p>
							<DatasourceBoxContainer
								type='group'
								selection={SelectionType.Custom}
								datasource={this.props.childGroups}
								selectedOptions={this.state.defaultSelectedGroups}
								selectDatasource={this.handleUpdateSelectedGroups}
							/>
						</div>
						<div className='col-2' style={leftRightButtonsDivStyle}>
							<Button outline onClick={this.handleMoveUnusedGroupsToChildGroups} style={leftRightButtonStyle}>
								<i className='fa fa-chevron-left' />
							</Button>
							<Button outline onClick={this.handleMoveChildGroupsToUnusedGroups} style={leftRightButtonStyle}>
								<i className='fa fa-chevron-right' />
							</Button>
						</div>
						<div className='col-5'>
							<p style={boldStyle}>Unused groups:</p>
							<DatasourceBoxContainer
								type='group'
								selection={SelectionType.Custom}
								datasource={this.props.allGroupsExceptChildGroups}
								selectedOptions={this.state.defaultUnusedGroups}
								selectDatasource={this.handleUpdateUnusedGroups}
							/>
						</div>
					</div>
					<div className='row'>
						<div className='col-6'>
							<Button outline onClick={this.handleReturnToView}>Cancel</Button>
							<Button outline onClick={this.handleEditGroup}>Submit changes</Button>
						</div>
						<div className='col-6 d-flex justify-content-end'>
							<Button outline className='justify-content-end' onClick={this.handleDeleteGroup}>Delete group</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	private handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
		const name = e.currentTarget.value;
		if (name) {
			this.setState({ name: name as string });
			this.props.editGroupName(name as string);
		}
	}

	private handleUpdatedSelectedMeters(selectedMeters: number[]) {
		this.setState({ selectedMeters });
	}

	private handleUpdateUnusedMeters(unusedMeters: number[]) {
		this.setState({ unusedMeters });
	}

	private handleUpdateSelectedGroups(selectedGroups: number[]) {
		this.setState({ selectedGroups });
	}

	private handleUpdateUnusedGroups(unusedGroups: number[]) {
		this.setState({ unusedGroups });
	}

	private handleMoveChildMetersToUnusedMeters() {
		this.props.changeChildMeters(_.difference(this.props.childMeters.map(meter => meter.id), this.state.selectedMeters));
		this.setState({ selectedMeters: [], defaultSelectedMeters: [] });
	}

	private handleMoveUnusedMetersToChildMeters() {
		this.props.changeChildMeters(_.union(this.props.childMeters.map(meter => meter.id), this.state.unusedMeters));
		this.setState({ unusedMeters: [], defaultUnusedMeters: [] });
	}

	private handleMoveChildGroupsToUnusedGroups() {
		this.props.changeChildGroups(_.difference(this.props.childGroups.map(group => group.id), this.state.selectedGroups));
		this.setState({ selectedGroups: [], defaultSelectedGroups: [] });
	}

	private handleMoveUnusedGroupsToChildGroups() {
		this.props.changeChildGroups(_.union(this.props.childGroups.map(group => group.id), this.state.unusedGroups));
		this.setState({ unusedGroups: [], defaultUnusedGroups: [] });
	}

	private handleEditGroup() {
		this.props.submitGroupInEditingIfNeeded();
	}

	private handleDeleteGroup() {
		this.props.deleteGroup();
	}

	private handleReturnToView() {
		this.props.changeDisplayModeToView();
	}
}
