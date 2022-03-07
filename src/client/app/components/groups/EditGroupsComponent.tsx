/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This component is the main page of the edit group page.
import * as React from 'react';
import * as _ from 'lodash';
import { Input, Button } from 'reactstrap';
import DatasourceBoxContainer from '../../containers/groups/DatasourceBoxContainer';
import { NamedIDItem } from '../../types/items';
import { SelectionType } from '../../containers/groups/DatasourceBoxContainer';
import { EditGroupNameAction, EditGroupGPSAction, EditGroupDisplayableAction, EditGroupNoteAction, EditGroupAreaAction,
	ChangeChildMetersAction, ChangeChildGroupsAction, ChangeDisplayModeAction, GroupDefinition } from '../../types/redux/groups';
import FooterContainer from '../../containers/FooterContainer';
import HeaderContainer from '../../containers/HeaderContainer';
import {  browserHistory } from '../../utils/history';
import { FormattedMessage, defineMessages, injectIntl, WrappedComponentProps } from 'react-intl';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import store from '../../index';
import { removeUnsavedChanges, updateUnsavedChanges } from '../../actions/unsavedWarning';
import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';
import { fetchGroupsDetails } from '../../actions/groups';
import translate from '../../utils/translate';

interface EditGroupsProps {
	currentGroup: GroupDefinition;
	childMeters: NamedIDItem[];
	childGroups: NamedIDItem[];
	allMetersExceptChildMeters: NamedIDItem[];
	allGroupsExceptChildGroups: NamedIDItem[];
	submitGroupInEditingIfNeeded(): Promise<any>;
	deleteGroup(): Promise<any>;
	editGroupName(name: string): EditGroupNameAction;
	editGroupGPS(gps: GPSPoint): EditGroupGPSAction;
	editGroupDisplayable(display: boolean): EditGroupDisplayableAction;
	editGroupNote(note: string): EditGroupNoteAction;
	editGroupArea(area: number): EditGroupAreaAction;
	changeChildMeters(selected: number[]): ChangeChildMetersAction;
	changeChildGroups(selected: number[]): ChangeChildGroupsAction;
	changeDisplayModeToView(): ChangeDisplayModeAction;
}

type EditGroupsPropsWithIntl = EditGroupsProps & WrappedComponentProps;

interface EditGroupsState {
	name: string;
	gpsInput: string;
	groupArea: string;
	groupNote: string;
	groupDisplay: boolean;
	selectedMeters: number[];
	defaultSelectedMeters: NamedIDItem[];
	unusedMeters: number[];
	defaultUnusedMeters: NamedIDItem[];
	selectedGroups: number[];
	defaultSelectedGroups: NamedIDItem[];
	unusedGroups: number[];
	defaultUnusedGroups: NamedIDItem[];
}

class EditGroupsComponent extends React.Component<EditGroupsPropsWithIntl, EditGroupsState> {
	constructor(props: EditGroupsPropsWithIntl) {
		super(props);
		this.state = {
			name: this.props.currentGroup.name,
			gpsInput: (this.props.currentGroup.gps) ?
			`${this.props.currentGroup.gps.latitude}, ${this.props.currentGroup.gps.longitude}` : '',
			groupArea: (this.props.currentGroup.area) ? `${this.props.currentGroup.area}` : '',
			groupNote: (this.props.currentGroup.note) ? `${this.props.currentGroup.note}` : '',
			groupDisplay: (this.props.currentGroup.displayable) ? this.props.currentGroup.displayable : false,
			selectedMeters: [],
			defaultSelectedMeters: [],
			unusedMeters: [],
			defaultUnusedMeters: [],
			selectedGroups: [],
			defaultSelectedGroups: [],
			unusedGroups: [],
			defaultUnusedGroups: []
		};
		// edit displayable to false if previously group had null displayable (past version of group)
		if (this.props.currentGroup.displayable === null) {
			this.props.editGroupDisplayable(false);
		}
		// make state dirty so submit is possible even if nothing is changed (should this be allowed?)
		else {
			this.props.editGroupDisplayable(this.props.currentGroup.displayable);
		}
		this.handleNameChange = this.handleNameChange.bind(this);
		this.handleGPSChange = this.handleGPSChange.bind(this);
		this.handleDisplayChange = this.handleDisplayChange.bind(this);
		this.handleNoteChange = this.handleNoteChange.bind(this);
		this.handleAreaChange = this.handleAreaChange.bind(this);
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
		this.removeUnsavedChangesFunction = this.removeUnsavedChangesFunction.bind(this);
	}

	public render() {
		const divStyle: React.CSSProperties = {
			paddingTop: '35px'
		};
		const divFlexStyle: React.CSSProperties = {
			display: 'flex'
		};
		const divBottomStyle: React.CSSProperties = {
			marginBottom: '20px'
		};
		const textAreaStyle: React.CSSProperties = {
			paddingLeft: '2px'
		};
		const metersDivStyle: React.CSSProperties = {
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
		const messages = defineMessages({ name: { id: 'name' }});
		return (
			<div>
				<UnsavedWarningContainer />
				<HeaderContainer />
				<div className='container-fluid'>
					<div style={divStyle} className='col-6'>
						<h3 style={centerTextStyle}>
							<FormattedMessage id='edit.group' />
						</h3>
					</div>
					<div style={divFlexStyle} className='row col-6'>
						<div className='col-4 float-left'>
							<p style={boldStyle}>
								<FormattedMessage id='group.id' />:
							</p>
							{this.props.currentGroup.id}
						</div>
						<div style={divBottomStyle} className='col-4'>
							<p style={boldStyle}>
								<FormattedMessage id='name' />:
							</p>
							<Input type='text' placeholder={this.props.intl.formatMessage(messages.name)} value={this.state.name} onChange={this.handleNameChange} />
						</div>
						<div style={divBottomStyle} className='col-4'>
							<p style={boldStyle}>
								<FormattedMessage id='group.gps' />:
							</p>
							<Input type='text' value={this.state.gpsInput} onChange={this.handleGPSChange} />
						</div>
					</div>
					<div style={divFlexStyle} className='row col-6'>
						<div style={divBottomStyle} className='col-4 float-left'>
							<p style={boldStyle}>
								<FormattedMessage id='displayable' />:
							</p>
							<Input type='select' value={this.state.groupDisplay.toString()} onChange={this.handleDisplayChange}>
								<option value='true'> True </option>
								<option value='false'> False </option>
							</Input>
						</div>
						<div style={divBottomStyle} className='col-4'>
							<p style={boldStyle}>
								<FormattedMessage id='note' />:
							</p>
							<textarea className='col-12' style={textAreaStyle} value={this.state.groupNote} onChange={this.handleNoteChange} />
						</div>
						<div style={divBottomStyle} className='col-4'>
							<p style={boldStyle}>
								<FormattedMessage id='area' />:
							</p>
							<Input type='text' value={this.state.groupArea} onChange={this.handleAreaChange}/>
						</div>
					</div>
					<div className='col-6'>
						<div className='row' style={metersDivStyle}>
							<div className='col-5'>
								<p style={boldStyle}>
									<FormattedMessage id='child.meters' />:
								</p>
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
								<p style={boldStyle}>
									<FormattedMessage id='unused.meters' />:
								</p>
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
								<p style={boldStyle}>
									<FormattedMessage id='child.groups' />:
								</p>
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
								<p style={boldStyle}>
									<FormattedMessage id='unused.groups' />:
								</p>
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
								<Button outline onClick={this.handleReturnToView}>
									<FormattedMessage id='cancel' />
								</Button>
								<Button outline onClick={() => this.handleEditGroup(null, null)}>
									<FormattedMessage id='submit.changes' />
								</Button>
							</div>
							<div className='col-6 d-flex justify-content-end'>
								<Button outline className='justify-content-end' onClick={this.handleDeleteGroup}>
									<FormattedMessage id='delete.group' />
								</Button>
							</div>
						</div>
					</div>
				</div>
				<FooterContainer />
			</div>
		);
	}

	private removeUnsavedChangesFunction(callback: () => void) {
		// This function is called to reset all the inputs to the initial state
		this.props.changeDisplayModeToView();
		// Fetch data from database to replace the current one
		store.dispatch<any>(fetchGroupsDetails()).then(callback);
	}

	private updateUnsavedChanges() {
		// Notify that there are unsaved changes
		store.dispatch(updateUnsavedChanges(this.removeUnsavedChangesFunction, this.handleEditGroup));
	}

	private removeUnsavedChanges() {
		// Notify that there are no unsaved changes
		store.dispatch(removeUnsavedChanges());
	}

	private handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
		const name = e.currentTarget.value;
		if (name) {
			this.setState({ name: name as string });
			this.props.editGroupName(name as string);
			this.updateUnsavedChanges();
		}
	}

	private handleGPSChange(e: React.ChangeEvent<HTMLInputElement>) {
		this.setState({ gpsInput: e.target.value });
		this.updateUnsavedChanges();
	}

	private handleDisplayChange(e: React.ChangeEvent<HTMLInputElement>) {
		this.props.editGroupDisplayable(e.target.value === 'true');
		this.setState({ groupDisplay: (e.target.value === 'true') });
		this.updateUnsavedChanges();
	}

	private handleNoteChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
		this.props.editGroupNote(e.target.value);
		this.setState({ groupNote: e.target.value });
		this.updateUnsavedChanges();
	}

	private handleAreaChange(e: React.ChangeEvent<HTMLInputElement>) {
		this.setState({ groupArea: e.target.value });
		this.updateUnsavedChanges();
		// still need to set state to parse check before submitting
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
		this.props.changeChildMeters(_.difference(this.props.childMeters.map((meter: NamedIDItem) => meter.id), this.state.selectedMeters));
		this.setState({ selectedMeters: [], defaultSelectedMeters: [] });
		this.updateUnsavedChanges();
	}

	private handleMoveUnusedMetersToChildMeters() {
		this.props.changeChildMeters(_.union(this.props.childMeters.map((meter: NamedIDItem) => meter.id), this.state.unusedMeters));
		this.setState({ unusedMeters: [], defaultUnusedMeters: [] });
		this.updateUnsavedChanges();
	}

	private handleMoveChildGroupsToUnusedGroups() {
		this.props.changeChildGroups(_.difference(this.props.childGroups.map((group: NamedIDItem) => group.id), this.state.selectedGroups));
		this.setState({ selectedGroups: [], defaultSelectedGroups: [] });
		this.updateUnsavedChanges();
	}

	private handleMoveUnusedGroupsToChildGroups() {
		this.props.changeChildGroups(_.union(this.props.childGroups.map((group: NamedIDItem) => group.id), this.state.unusedGroups));
		this.setState({ unusedGroups: [], defaultUnusedGroups: [] });
		this.updateUnsavedChanges();
	}

	private handleEditGroup(successCallback: any, failureCallback: any) {
		// The callbacks are used for displaying unsaved warning
		const gpsProxy = this.state.gpsInput.replace('(','').replace(')','').replace(' ', '');
		const pattern2 = /^\d+(\.\d+)?$/;
		// need to check gps and area
		// gps and area are still optional so check if blank
		if (this.state.groupArea.match(pattern2) || this.state.groupArea === '') {
			if (this.state.groupArea !== '') {
				this.props.editGroupArea(parseFloat(this.state.groupArea));
			}
			if (this.state.gpsInput === '' || isValidGPSInput(gpsProxy)) {
				if (this.state.gpsInput !== '') {
					// if it satisfies if condition, and defined, then set GPSPoint
					const parseGPS = gpsProxy.split(',');
					// should only have 1 comma
					const gPoint: GPSPoint = {
						longitude: parseFloat(parseGPS[1]),
						latitude: parseFloat(parseGPS[0])
					};
					this.props.editGroupGPS(gPoint);
				}
				// Notify that there are no unsaved changes after clicking the submit button
				this.removeUnsavedChanges();
				if (successCallback != null) {
					// This function is call in displaying unsaved warning process
					this.props.submitGroupInEditingIfNeeded().then(successCallback, failureCallback);
				} else {
					this.props.submitGroupInEditingIfNeeded().then(() => {
						// Redirect users to /groups when they click the submit button.
						browserHistory.push('/groups');
					});
				}
			}
		}
		else {
			window.alert(translate('area.error'));
		}
	}

	private handleDeleteGroup() {
		this.props.deleteGroup();
		this.removeUnsavedChanges();
	}

	private handleReturnToView() {
		browserHistory.push('/groups');
		this.props.changeDisplayModeToView();
	}
}

export default injectIntl(EditGroupsComponent);
