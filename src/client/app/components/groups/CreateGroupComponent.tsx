/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Input, Button } from 'reactstrap';
import DatasourceBoxContainer from '../../containers/groups/DatasourceBoxContainer';
import { SelectionType } from '../../containers/groups/DatasourceBoxContainer';
import { NamedIDItem } from '../../types/items';
import { CreateNewBlankGroupAction, EditGroupNameAction,
	EditGroupGPSAction, EditGroupDisplayableAction, EditGroupNoteAction,
	EditGroupAreaAction, ChangeDisplayModeAction } from '../../types/redux/groups';
import HeaderContainer from '../../containers/HeaderContainer';
import FooterContainer from '../../containers/FooterContainer';
import { browserHistory } from '../../utils/history';
import { FormattedMessage, defineMessages, injectIntl, WrappedComponentProps } from 'react-intl';
import TooltipHelpContainerAlternative from '../../containers/TooltipHelpContainerAlternative';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import store from '../../index';
import { removeUnsavedChanges, updateUnsavedChanges } from '../../actions/unsavedWarning';
import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';
import translate from '../../utils/translate';

interface CreateGroupProps {
	meters: NamedIDItem[];
	groups: NamedIDItem[];
	createNewBlankGroup(): CreateNewBlankGroupAction;
	editGroupName(name: string): EditGroupNameAction;
	editGroupGPS(gps: GPSPoint): EditGroupGPSAction;
	editGroupDisplayable(display: boolean): EditGroupDisplayableAction;
	editGroupNote(note: string): EditGroupNoteAction;
	editGroupArea(area: number): EditGroupAreaAction;
	submitGroupInEditingIfNeeded(): Promise<any>;
	changeDisplayModeToView(): ChangeDisplayModeAction;
}

interface CreateGroupState {
	gpsInput: string;
	groupArea: string;
}

type CreateGroupPropsWithIntl = CreateGroupProps & WrappedComponentProps;

class CreateGroupComponent extends React.Component<CreateGroupPropsWithIntl, CreateGroupState> {
	constructor(props: CreateGroupPropsWithIntl) {
		super(props);
		this.state = {
			gpsInput: '',
			groupArea: ''
		};
		this.handleNameChange = this.handleNameChange.bind(this);
		this.handleGPSChange = this.handleGPSChange.bind(this);
		this.handleDisplayChange = this.handleDisplayChange.bind(this);
		this.handleNoteChange = this.handleNoteChange.bind(this);
		this.handleAreaChange = this.handleAreaChange.bind(this);
		this.handleCreateGroup = this.handleCreateGroup.bind(this);
		this.handleReturnToView = this.handleReturnToView.bind(this);
		this.removeUnsavedChangesFunction = this.removeUnsavedChangesFunction.bind(this);
	}

	public componentDidMount() {
		this.props.createNewBlankGroup();
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
		const textStyle: React.CSSProperties = {
			fontWeight: 'bold',
			margin: 0
		};
		const centerTextStyle: React.CSSProperties = {
			textAlign: 'center'
		};
		const textAreaStyle: React.CSSProperties = {
			paddingLeft: '2px'
		};
		const messages = defineMessages({ name: { id: 'name' }});
		return (
			<div>
				<UnsavedWarningContainer />
				<HeaderContainer />
				<TooltipHelpContainerAlternative page='meters' />
				<div className='container-fluid'>
					<div style={divStyle} className='col-6'>
						<h3 style={centerTextStyle}>
							<FormattedMessage id='create.group' />
						</h3>
					</div>
					<div style={divFlexStyle} className='row col-6'>
						<div style={divBottomStyle} className='col-4 float-left'>
							<p style={textStyle}>
								<FormattedMessage id='name' />:
							</p>
							<Input type='text' placeholder={this.props.intl.formatMessage(messages.name)} onChange={this.handleNameChange} />
						</div>
						<div style={divBottomStyle} className='col-4'>
							<p style={textStyle}>
								<FormattedMessage id='group.gps' />:
							</p>
							<Input type='text' onChange={this.handleGPSChange} />
						</div>
					</div>
					<div style={divFlexStyle} className='row col-6'>
						<div style={divBottomStyle} className='col-4 float-left'>
							<p style={textStyle}>
								<FormattedMessage id='displayable' />:
							</p>
							<Input type='select' name='displayselect' onChange={this.handleDisplayChange}>
								<option value='true'> True </option>
								<option value='false'> False </option>
							</Input>
						</div>
						<div style={divBottomStyle} className='col-4'>
							<p style={textStyle}>
								<FormattedMessage id='note' />:
							</p>
							<textarea className='col-12' style={textAreaStyle} onChange={this.handleNoteChange} />
						</div>
						<div style={divBottomStyle} className='col-4'>
							<p style={textStyle}>
								<FormattedMessage id='area' />:
							</p>
							<Input type='text' onChange={this.handleAreaChange}/>
						</div>
					</div>
					<div className='col-6'>
						<div style={divBottomStyle}>
							<p style={textStyle}>
								<FormattedMessage id='select.meters' />:
							</p>
							<DatasourceBoxContainer type='meter' selection={SelectionType.All} />
						</div>
						<div style={divBottomStyle}>
							<p style={textStyle}>
								<FormattedMessage id='select.groups' />:
							</p>
							<DatasourceBoxContainer type='group' selection={SelectionType.All} />
						</div>
						<div className='row'>
							<div className='col-6'>
								<Button outline type='submit' onClick={this.handleReturnToView}>
									<FormattedMessage id='cancel' />
								</Button>
							</div>
							<div className='col-6 d-flex justify-content-end'>
								<Button outline type='submit' onClick={() => this.handleCreateGroup(null, null)}>
									<FormattedMessage id='create.group' />
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
		this.props.changeDisplayModeToView();
		callback();
	}

	private updateUnsavedChanges() {
		// Notify that there are unsaved changes
		store.dispatch(updateUnsavedChanges(this.removeUnsavedChangesFunction, this.handleCreateGroup));
	}

	private removeUnsavedChanges() {
		// Notify that there are no unsaved changes
		store.dispatch(removeUnsavedChanges());
	}

	private handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.target.value;
		if (value) {
			this.props.editGroupName(value as string);
		} else {
			this.props.editGroupName('');
		}
		this.updateUnsavedChanges();
	}

	private handleGPSChange(e: React.ChangeEvent<HTMLInputElement>) {
		this.setState({ gpsInput: e.target.value });
		this.updateUnsavedChanges();
	}

	private handleDisplayChange(e: React.ChangeEvent<HTMLInputElement>) {
		this.props.editGroupDisplayable(e.target.value === 'true');
		this.updateUnsavedChanges();
	}

	private handleNoteChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
		this.props.editGroupNote(e.target.value);
		this.updateUnsavedChanges();
	}

	private handleAreaChange(e: React.ChangeEvent<HTMLInputElement>) {
		this.setState({ groupArea: e.target.value });
		this.updateUnsavedChanges();
		// still need to set state to parse check before submitting
	}

	private handleCreateGroup(successCallback: any, failureCallback: any) {
		// The callback is used for displaying unsaved warning.
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
				// Notify that there are no unsaved changes after clicking the create button
				this.removeUnsavedChanges();
				if (successCallback != null) {
					this.props.submitGroupInEditingIfNeeded().then(successCallback, failureCallback);
				} else {
					this.props.submitGroupInEditingIfNeeded().then(() => {
						// Redirect users to /groups when they click the create group button.
						browserHistory.push('/groups');
					});
				}
			}
		}
		else {
			window.alert(translate('area.error'));
		}
	}

	private handleReturnToView() {
		browserHistory.push('/groups');
		this.props.changeDisplayModeToView();
	}
}

export default injectIntl(CreateGroupComponent);
