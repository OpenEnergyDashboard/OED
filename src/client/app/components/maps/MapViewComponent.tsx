/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import {Button} from 'reactstrap';
import {Link} from 'react-router';
import {hasToken} from '../../utils/token';
import {FormattedMessage} from 'react-intl';
import {CalibrationModeTypes, MapMetadata} from '../../types/redux/map';
import * as moment from 'moment';

interface MapViewProps {
	// The ID of the map to be displayed
	id: number;
	// The map metadata being displayed by this row
	map: MapMetadata;
	isEdited: boolean;
	isSubmitting: boolean;
	// The function used to dispatch the action to edit map details
	editMapDetails(map: MapMetadata): any;
	setCalibration(mode: CalibrationModeTypes, mapID: number): any;
	removeMap(id: number): any;
}

interface MapViewState {
	nameFocus: boolean;
	nameInput: string;
	noteFocus: boolean;
	noteInput: string;
}

export default class MapViewComponent extends React.Component<MapViewProps, MapViewState> {
	constructor(props: MapViewProps) {
		super(props);
		this.state = {
			nameFocus: false,
			nameInput: this.props.map.name,
			noteFocus: false,
			noteInput: (this.props.map.note) ? this.props.map.note : ''
		};
		this.handleCalibrationSetting = this.handleCalibrationSetting.bind(this);
		this.toggleMapDisplayable = this.toggleMapDisplayable.bind(this);
		this.toggleNameInput = this.toggleNameInput.bind(this);
		this.handleNameChange = this.handleNameChange.bind(this);
		this.toggleNoteInput = this.toggleNoteInput.bind(this);
		this.handleNoteChange = this.handleNoteChange.bind(this);
		this.toggleDelete = this.toggleDelete.bind(this);
	}

	public render() {
		return (
			<tr>
				<td> {this.props.map.id} {this.formatStatus()}</td>
				<td> {this.formatName()} </td>
				{hasToken() && <td> {this.formatDisplayable()} </td>}
				{hasToken() && <td> {moment(this.props.map.modifiedDate).format('dddd, MMM DD, YYYY hh:mm a')} </td>}
				{hasToken() && <td> {this.formatFilename()} </td>}
				{hasToken() && <td> {this.formatNote()} </td>}
				{hasToken() && <td> {this.formatCalibrationStatus()} </td>}
				{hasToken() && <td> {this.formatDeleteButton()} </td>}
			</tr>
		);
	}

	private formatStatus(): string {
		if (this.props.isSubmitting) {
			return '(submitting)';
		}

		if (this.props.isEdited) {
			return '(edited)';
		}

		return '';
	}

	private toggleDelete() {
		const consent = window.confirm(`Are you sure you want to remove map "${this.props.map.name}"?`);
		if (consent) { this.props.removeMap(this.props.id); }
	}

	private formatDeleteButton() {

		const editButtonStyle: React.CSSProperties = {
			display: 'inline', // or 'none'
			paddingLeft: '5px'
		};
		return <Button style={editButtonStyle} color='primary' onClick={this.toggleDelete}>
			<FormattedMessage id={'delete.map'} />
			</Button>;
	}

	private styleEnabled(): React.CSSProperties {
		return { color: 'green' };
	}

	private styleDisabled(): React.CSSProperties {
			return { color: 'red' };
	}

	private styleToggleBtn(): React.CSSProperties {
		return { float: 'right' };
	}

	private toggleMapDisplayable() {
		const editedMap = {
			...this.props.map,
			displayable: !this.props.map.displayable
		};
		this.props.editMapDetails(editedMap);
	}

	private formatDisplayable() {
		let styleFn;
		let messageId;
		let buttonMessageId;

		if (this.props.map.displayable) {
			styleFn = this.styleEnabled;
			messageId = 'map.is.displayable';
			buttonMessageId = 'hide';
		} else {
			styleFn = this.styleDisabled;
			messageId = 'map.is.not.displayable';
			buttonMessageId = 'show';
		}

		let toggleButton;
		if (hasToken()) {
			toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.toggleMapDisplayable}>
				<FormattedMessage id={buttonMessageId} />
				</Button>;
		} else {
			toggleButton = <div />;
		}

		return (
			<span>
			<span style={styleFn()}>
				<FormattedMessage id={messageId} />
			</span>
			{toggleButton}
			</span>
		);
	}

	private toggleNameInput() {
		if (this.state.nameFocus) {
			const editedMap = {
				...this.props.map,
				name: this.state.nameInput
			};
			this.props.editMapDetails(editedMap);
		}
		this.setState({nameFocus: !this.state.nameFocus});
	}

	private handleNameChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
		this.setState({ nameInput: event.target.value});
	}

	private formatName() {
		let formattedName;
		let buttonMessageId;
		if (this.state.nameFocus) {
			formattedName = <textarea id={'name'} value={this.state.nameInput} onChange={event => this.handleNameChange(event)}/>;
			buttonMessageId = 'update';
		} else {
			formattedName = <div>{this.state.nameInput}</div>;
			buttonMessageId = 'edit';
		}

		let toggleButton;
		if (hasToken()) {
			toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.toggleNameInput}>
				<FormattedMessage id={buttonMessageId} />
			</Button>;
		} else {
			toggleButton = <div />;
		}

		if (hasToken()) {
			return (
				<div>
					{formattedName}
					{toggleButton}
				</div>
			);
		} else {
			return (
				<div>
					{this.props.map.name}
					{toggleButton}
				</div>
			);
		}
	}

	private toggleNoteInput() {
		if (this.state.noteFocus) {
			const editedMap = {
				...this.props.map,
				note: this.state.noteInput
			};
			this.props.editMapDetails(editedMap);
		}
		this.setState({noteFocus: !this.state.noteFocus});
	}

	private handleNoteChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
		this.setState({ noteInput: event.target.value});
	}

	private formatNote() {
		let formattedNote;
		let buttonMessageId;
		if (this.state.noteFocus) {
			formattedNote = <textarea id={'note'} value={this.state.noteInput} onChange={event => this.handleNoteChange(event)}/>;
			buttonMessageId = 'update';
		} else {
			formattedNote = <div>{this.state.noteInput}</div>;
			buttonMessageId = 'edit';
		}

		let toggleButton;
		if (hasToken()) {
			toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.toggleNoteInput}>
				<FormattedMessage id={buttonMessageId} />
			</Button>;
		} else {
			toggleButton = <div />;
		}

		if (hasToken()) {
			return (
				<div>
					{formattedNote}
					{toggleButton}
				</div>
			);
		} else {
			return (
				<div>
					{this.props.map.note}
					{toggleButton}
				</div>
			);
		}
	}

	private styleCalibrated(): React.CSSProperties {
		return { color: 'black' };
	}

	private styleNotCalibrated(): React.CSSProperties {
		return { color: 'gray' };
	}

	private formatCalibrationStatus() {
		let styleFn;
		let messageID;
		if (this.props.map.origin && this.props.map.opposite) {
			styleFn = this.styleCalibrated;
			messageID = 'map.is.calibrated';
		} else {
			styleFn = this.styleNotCalibrated;
			messageID = 'map.is.not.calibrated';
		}
		return (
			<span>
				<span style={styleFn()}>
					<FormattedMessage id={messageID} />
				</span>
				<Link to='/calibration' onClick={() => this.handleCalibrationSetting(CalibrationModeTypes.calibrate)}>
					<Button style={this.styleToggleBtn()} color='primary'>
						<FormattedMessage id='map.calibrate' />
					</Button>
				</Link>
			</span>
		);
	}

	private formatFilename() {
		return (
			<span>
				<span>{this.props.map.filename}</span>
				<Link to='/calibration' onClick={() => this.handleCalibrationSetting(CalibrationModeTypes.initiate)}>
					<Button style={this.styleToggleBtn()} color='primary'>
						<FormattedMessage id='map.upload.new.file' />
					</Button>
				</Link>
			</span>
		);
	}

	private handleCalibrationSetting(mode: CalibrationModeTypes) {
		this.props.setCalibration(mode, this.props.id);
	}
}

