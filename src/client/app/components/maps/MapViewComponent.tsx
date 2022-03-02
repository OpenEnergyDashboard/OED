/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button } from 'reactstrap';
import { Link } from 'react-router-dom';
import { hasToken } from '../../utils/token';
import { FormattedMessage, injectIntl, WrappedComponentProps } from 'react-intl';
import { CalibrationModeTypes, MapMetadata } from '../../types/redux/map';
import * as moment from 'moment';
import store from '../../index';
import { updateUnsavedChanges } from '../../actions/unsavedWarning';
import { fetchMapsDetails, submitEditedMaps, confirmEditedMaps } from '../../actions/map';

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
	circleFocus: boolean;
	circleInput: string;
	noteFocus: boolean;
	noteInput: string;
}

type MapViewPropsWithIntl = MapViewProps & WrappedComponentProps;

class MapViewComponent extends React.Component<MapViewPropsWithIntl, MapViewState> {
	constructor(props: MapViewPropsWithIntl) {
		super(props);
		this.state = {
			nameFocus: false,
			nameInput: this.props.map.name,
			noteFocus: false,
			noteInput: (this.props.map.note) ? this.props.map.note : '',
			circleFocus: false,
			// circleSize should always be a valid string due to how stored and mapRow.
			circleInput: this.props.map.circleSize.toString()
		};
		this.handleCalibrationSetting = this.handleCalibrationSetting.bind(this);
		this.toggleMapDisplayable = this.toggleMapDisplayable.bind(this);
		this.toggleNameInput = this.toggleNameInput.bind(this);
		this.handleNameChange = this.handleNameChange.bind(this);
		this.toggleNoteInput = this.toggleNoteInput.bind(this);
		this.handleNoteChange = this.handleNoteChange.bind(this);
		this.toggleDelete = this.toggleDelete.bind(this);
		this.notifyCalibrationNeeded = this.notifyCalibrationNeeded.bind(this);
		this.handleSizeChange = this.handleSizeChange.bind(this);
		this.toggleCircleInput = this.toggleCircleInput.bind(this);
	}

	public render() {
		return (
			<tr>
				<td> {this.props.map.id} {this.formatStatus()}</td>
				<td> {this.formatName()} </td>
				{hasToken() && <td> {this.formatDisplayable()} </td>}
				{hasToken() && <td> {this.formatCircleSize()} </td>}
				{hasToken() && <td> {moment(this.props.map.modifiedDate).format('dddd, MMM DD, YYYY hh:mm a')} </td>}
				{hasToken() && <td> {this.formatFilename()} </td>}
				{hasToken() && <td> {this.formatNote()} </td>}
				{hasToken() && <td> {this.formatCalibrationStatus()} </td>}
				{hasToken() && <td> {this.formatDeleteButton()} </td>}
			</tr>
		);
	}

	componentDidMount() {
		if (this.props.isEdited) {
			// When the props.isEdited is true after loading the page, there are unsaved changes
			this.updateUnsavedChanges();
		}
	}

	componentDidUpdate(prevProps: MapViewProps) {
		if (this.props.isEdited && !prevProps.isEdited) {
			// When the props.isEdited changes from false to true, there are unsaved changes
			this.updateUnsavedChanges();
		}
	}

	private removeUnsavedChangesFunction(callback: () => void) {
		// This function is called to reset all the inputs to the initial state
		store.dispatch<any>(confirmEditedMaps()).then(() => {
			store.dispatch<any>(fetchMapsDetails()).then(callback);
		});
	}

	private submitUnsavedChangesFunction(successCallback: () => void, failureCallback: () => void) {
		// This function is called to submit the unsaved changes
		store.dispatch<any>(submitEditedMaps()).then(successCallback, failureCallback);
	}

	private updateUnsavedChanges() {
		// Notify that there are unsaved changes
		store.dispatch(updateUnsavedChanges(this.removeUnsavedChangesFunction, this.submitUnsavedChangesFunction));
	}

	private handleSizeChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
		this.setState({ circleInput: event.target.value });
	}

	private toggleCircleInput() {
		let checkval: boolean = true;
		// if trying to submit an updated value
		if (this.state.circleFocus) {
			const regtest = /^\d+(\.\d+)?$/;
			checkval = regtest.test(this.state.circleInput);
			if (checkval) {
				if (parseFloat(this.state.circleInput) > 2.0) {
					checkval = false;
				}
				else {
					const editedMap = {
						...this.props.map,
						circleSize: parseFloat(this.state.circleInput)
					};
					this.props.editMapDetails(editedMap);
				}
			}
		}
		if (checkval) {
			this.setState({ circleFocus: !this.state.circleFocus });
		}
		else {
			window.alert(`${this.props.intl.formatMessage({ id: 'invalid.number' })}`);
		}
	}

	private formatCircleSize() {
		let formattedCircleSize;
		let buttonMessageId;
		if (this.state.circleFocus) {
			// default value for autoFocus is true and for all attributes that would be set autoFocus={true}
			formattedCircleSize = <textarea id={'csize'} autoFocus value={this.state.circleInput} onChange={event => this.handleSizeChange(event)} />;
			buttonMessageId = 'update';
		} else {
			formattedCircleSize = <div>{this.state.circleInput}</div>;
			buttonMessageId = 'edit';
		}

		let toggleButton;
		if (hasToken()) {
			toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.toggleCircleInput}>
				<FormattedMessage id={buttonMessageId} />
			</Button>;
		} else {
			toggleButton = <div />;
		}

		if (hasToken()) {
			return (
				<div>
					{formattedCircleSize}
					{toggleButton}
				</div>
			);
		} else {
			return (
				<div>
					{this.props.map.circleSize}
					{toggleButton}
				</div>
			);
		}
	}

	private formatStatus(): string {
		if (this.props.isSubmitting) {
			return '(' + this.props.intl.formatMessage({ id: 'submitting' }) + ')';
		}
		if (this.props.isEdited) {
			return this.props.intl.formatMessage({ id: 'edited' });
		}
		return '';
	}

	private toggleDelete() {
		const consent = window.confirm(`${this.props.intl.formatMessage({ id: 'map.confirm.remove' })} "${this.props.map.name}"?`);
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
			// throw out alert if the admin wants to display uncalibrated map
			if (!(this.props.map.origin && this.props.map.opposite)) {
				toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.notifyCalibrationNeeded}>
					<FormattedMessage id={buttonMessageId} />
				</Button>;
			}
			// if map is already calibrated, the button will allow it to be displayed
			else {
				toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.toggleMapDisplayable}>
					<FormattedMessage id={buttonMessageId} />
				</Button>;
			}
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

	// this function throws alert on the browser notifying that map needs calibrating before display
	private notifyCalibrationNeeded() {
		window.alert(`${this.props.intl.formatMessage({ id: 'map.notify.calibration.needed' })} "${this.props.map.name}"`);
	}

	private toggleNameInput() {
		if (this.state.nameFocus) {
			const editedMap = {
				...this.props.map,
				name: this.state.nameInput
			};
			this.props.editMapDetails(editedMap);
		}
		this.setState({ nameFocus: !this.state.nameFocus });
	}

	private handleNameChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
		this.setState({ nameInput: event.target.value });
	}

	private formatName() {
		let formattedName;
		let buttonMessageId;
		if (this.state.nameFocus) {
			// default value for autoFocus is true and for all attributes that would be set autoFocus={true}
			formattedName = <textarea id={'name'} autoFocus value={this.state.nameInput} onChange={event => this.handleNameChange(event)} />;
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
		this.setState({ noteFocus: !this.state.noteFocus });
	}

	private handleNoteChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
		this.setState({ noteInput: event.target.value });
	}

	private formatNote() {
		let formattedNote;
		let buttonMessageId;
		if (this.state.noteFocus) {
			// default value for autoFocus is true and for all attributes that would be set autoFocus={true}
			formattedNote = <textarea id={'note'} autoFocus value={this.state.noteInput} onChange={event => this.handleNoteChange(event)} />;
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
		this.updateUnsavedChanges();
	}
}

export default injectIntl(MapViewComponent);