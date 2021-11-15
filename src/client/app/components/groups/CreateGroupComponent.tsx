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
import { FormattedMessage, InjectedIntlProps, injectIntl, defineMessages } from 'react-intl';
import TooltipHelpContainerAlternative from '../../containers/TooltipHelpContainerAlternative';
import { GPSPoint } from 'utils/calibration';

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

type CreateGroupPropsWithIntl = CreateGroupProps & InjectedIntlProps;

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
	}

	public componentWillMount() {
		this.props.createNewBlankGroup();
	}

	public render() {
		const divStyle: React.CSSProperties = {
			paddingTop: '35px'
		};
		const divFlexStyle: React.CSSProperties = {
			display: 'flex'
		}
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
								<FormattedMessage id='map.note' />:
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
								<Button outline type='submit' onClick={this.handleCreateGroup}>
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

	private handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.target.value;
		if (value) {
			this.props.editGroupName(value as string);
		} else {
			this.props.editGroupName('');
		}
	}

	private handleGPSChange(e: React.ChangeEvent<HTMLInputElement>) {
		this.setState({ gpsInput: e.target.value });
	}

	private handleDisplayChange(e: React.ChangeEvent<HTMLInputElement>) {
		this.props.editGroupDisplayable(e.target.value === 'true');
	}

	private handleNoteChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
		this.props.editGroupNote(e.target.value);
	}

	private handleAreaChange(e: React.ChangeEvent<HTMLInputElement>) {
		this.setState({ groupArea: e.target.value });
		// still need to set state to parse check before submitting
	}

	private handleCreateGroup() {
		// need to check gps and area
		// gps and area are still optional so check if blank
		const pattern = /^(\()?\d+\,\d+(\))?$/;
		if (this.state.gpsInput === '' || this.state.gpsInput.match(pattern)) {
			// if it satisfies if condition, and defined, then set GPSPoint
			if (this.state.gpsInput !== '') {
				const parseGPS = this.state.gpsInput.replace('(','').replace(')','').split(',');
				// should only have 1 comma
				const gPoint: GPSPoint = {
					longitude: parseFloat(parseGPS[0]),
					latitude: parseFloat(parseGPS[1])
				};
				this.props.editGroupGPS(gPoint);
			}
			const pattern2 = /^\d+(\.\d+)?$/;
			if (this.state.groupArea.match(pattern2) || this.state.groupArea === '') {
				if (this.state.groupArea !== '') {
					this.props.editGroupArea(parseFloat(this.state.groupArea));
				}
				// this.props.submitGroupInEditingIfNeeded();
			}
			else {
				window.alert(this.props.intl.formatMessage({id: 'area.error'}));
			}
		}
		else {
			window.alert(this.props.intl.formatMessage({id: 'group.gps.error'}));
		}
	}

	private handleReturnToView() {
		this.props.changeDisplayModeToView();
		browserHistory.push('/groups');
	}
}

export default injectIntl<CreateGroupProps>(CreateGroupComponent);
