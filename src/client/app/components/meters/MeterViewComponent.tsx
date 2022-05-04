/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button } from 'reactstrap';
import { FormattedMessage, injectIntl, WrappedComponentProps } from 'react-intl';
import { MeterMetadata, EditMeterDetailsAction } from '../../types/redux/meters';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import { updateUnsavedChanges } from '../../actions/unsavedWarning';
import { fetchMetersDetails, submitEditedMeters, confirmEditedMeters } from '../../actions/meters';
import store from '../../index';
import ModalCard from './MeterModalEditComponent';
import '../../styles/meter-card-page.css'

interface MeterViewProps {
	// The ID of the meter to be displayed
	id: number;
	// The meter metadata being displayed by this row
	meter: MeterMetadata;
	onSubmitClicked: () => void;
	isEdited: boolean;
	isSubmitting: boolean;
	loggedInAsAdmin: boolean;
	show: boolean;
	onHide: boolean
	// The function used to dispatch the action to edit meter details
	editMeterDetails(meter: MeterMetadata): EditMeterDetailsAction;
	log(level: string, message: string): any;
	//submitEditMeters(meter: MeterMetadata): SubmitEditedMeterAction;
}

interface MeterViewState {
	gpsFocus: boolean;
	gpsInput: string;
	identifierFocus: boolean;
	identifierInput: string;
	show: boolean;
	onHide: boolean;
}

type MeterViewPropsWithIntl = MeterViewProps & WrappedComponentProps;

class MeterViewComponent extends React.Component<MeterViewPropsWithIntl, MeterViewState> {
	constructor(props: MeterViewPropsWithIntl) {
		super(props);
		this.state = {
			gpsFocus: false,
			gpsInput: (this.props.meter.gps) ? `${this.props.meter.gps.latitude},${this.props.meter.gps.longitude}` : '',
			identifierFocus: false,
			identifierInput: this.props.meter.identifier,
			show: false,
			onHide: true,
		};
		this.toggleMeterDisplayable = this.toggleMeterDisplayable.bind(this);
		this.toggleMeterEnabled = this.toggleMeterEnabled.bind(this);
		this.toggleGPSInput = this.toggleGPSInput.bind(this);
		this.handleGPSChange = this.handleGPSChange.bind(this);
		this.changeTimeZone = this.changeTimeZone.bind(this);
		this.toggleIdentifierInput = this.toggleIdentifierInput.bind(this);
		this.onCancel = this.onCancel.bind(this);
		this.handleIdentifierChange = this.handleIdentifierChange.bind(this);
	}
	/**
	 *  handles modalState for both Show and Close
	 */
	handleShow = () => {
		this.setState({ show: true });
	}

	handleClose = () => {
		this.setState({ show: false });
	}

	public render() {
		const loggedInAsAdmin = this.props.loggedInAsAdmin;
		return (

			<div className="card">
				<div className="identifier-container">
					{this.formatIdentifierInput()}
				</div>
				<div className="unit-container">
					Unit
					<span className="custom-select">
						{/* TODO --- get data for unit from resource generalization*/}
						_______
					</span>
				</div>
				<div className="toggle-container">
					<div className="on-off-switch">
						{this.formatEnabled()}
					</div>
					{loggedInAsAdmin && <div className="on-off-switch">
						{this.formatDisplayable()}
					</div>}
				</div>
				{this.isAdmin()}
			</div>
			// TODO move this and implement on MeterModalEditComponent; Time zone being null
			// {loggedInAsAdmin && <td> <TimeZoneSelect current={this.props.meter.timeZone} handleClick={this.changeTimeZone} /> </td>}
		);
	}

	private isAdmin() {
		const loggedInAsAdmin = this.props.loggedInAsAdmin;
		if (loggedInAsAdmin) {
			return (
				<div className="edit-btn">
					<Button variant="Secondary" onClick={this.handleShow}>
						Edit Meter
					</Button>
					<ModalCard
						show={this.state.show}
						onhide={this.handleClose}
						id={this.props.meter.id}
						identifier={this.props.meter.identifier}
						units={this.props.meter.meterType}
						name={this.props.meter.name}
						meterType={this.props.meter.meterType}
						gps={this.props.meter.gps}
						Area={this.props.meter.area}
						displayable={this.props.meter.displayable}
						enabled={this.props.meter.enabled}
						graphicUnit={this.props.meter.graphicUnit}
						meterAddress={this.props.meter.ipAddress}
						notes={this.props.meter.note}
						cumulative={this.props.meter.cumulative}
						cumulativeReset={this.props.meter.cumulativeReset}
						cumulativeResetStart={this.props.meter.cumulativeResetStart}
						cumulativeResetEnd={this.props.meter.cumulativeResetEnd}
						endOnlyTime={this.props.meter.endOnlyTime}
						readingGap={this.props.meter.readingGap}
						readingVariation={this.props.meter.readingVariation}
						readingDuplication={this.props.meter.readingDuplication}
						timesort={this.props.meter.timesort}
						startTimestamp={this.props.meter.startTimestamp}
						endTimestamp={this.props.meter.endTimestamp}
						onSaveChanges={this.onSaveChanges}
						handleIdentifierChange={this.handleIdentifierChange}
						onCancel={this.onCancel} />
				</div>
			)
		}
		return null;
	}

	/**
	 *  Nn save handler in progress ( Meter Detail Component)
	 *	if double clicked then the save changes take affect otherwise a single click will cause
	 *	all conditions to be false.
	 */
	public onSaveChanges = () => {
		this.toggleIdentifierInput();
		this.updateUnsavedChanges();
		this.props.onSubmitClicked();
		this.handleClose();
	}
	/**
	 * Handles the Prop Hide for modal and resets any variable changes that had occured
	 */
	onCancel() {
		this.setState({ identifierFocus: false });
		this.handleClose();
	}


	private removeUnsavedChangesFunction(callback: () => void) {
		// This function is called to reset all the inputs to the initial state
		store.dispatch<any>(confirmEditedMeters()).then(() => {
			store.dispatch<any>(fetchMetersDetails()).then(callback);
		});
	}

	private submitUnsavedChangesFunction(successCallback: () => void, failureCallback: () => void) {
		// This function is called to submit the unsaved changes
		store.dispatch<any>(submitEditedMeters()).then(successCallback, failureCallback);
	}

	private updateUnsavedChanges() {
		// Notify that there are unsaved changes
		store.dispatch(updateUnsavedChanges(this.removeUnsavedChangesFunction, this.submitUnsavedChangesFunction));
	}

	componentDidUpdate(prevProps: MeterViewProps) {
		if (this.props.isEdited && !prevProps.isEdited) {
			// When the props.isEdited changes from false to true, there are unsaved changes
			this.updateUnsavedChanges();
		}
	}

	private toggleMeterDisplayable() {
		const editedMeter = this.props.meter;
		editedMeter.displayable = !editedMeter.displayable;
		this.props.editMeterDetails(editedMeter);
	}

	private toggleMeterEnabled() {
		const editedMeter = this.props.meter;
		editedMeter.enabled = !editedMeter.enabled;
		this.props.editMeterDetails(editedMeter);
	}

	private changeTimeZone(value: string): void {
		const editedMeter = this.props.meter;
		editedMeter.timeZone = value;
		this.props.editMeterDetails(editedMeter);
	}

	private formatDisplayable() {

		let messageId;
		let displaySwitch;

		if (this.props.meter.displayable) {

			messageId = 'meter.is.displayable';
			displaySwitch = <span className="on-off-switch-span-on"><FormattedMessage id={messageId} /></span>

		} else {

			messageId = 'meter.is.not.displayable';
			displaySwitch = <span className="on-off-switch-span-off"><FormattedMessage id={messageId} /></span>

		}

		return (
			displaySwitch
		);
	}

	private formatEnabled() {
		let messageId;
		let enableSwitch;

		if (this.props.meter.enabled) {
			messageId = 'meter.is.enabled';
			enableSwitch = <span className="on-off-switch-span-on"><FormattedMessage id={messageId} /></span>
		} else {
			messageId = 'meter.is.not.enabled';
			enableSwitch = <span className="on-off-switch-span-off"><FormattedMessage id={messageId} /></span>
		}
		return (
			enableSwitch
		);

	}

	private toggleGPSInput() {
		if (this.state.gpsFocus) {
			const input = this.state.gpsInput;
			if (input.length === 0) {
				const editedMeter = {
					...this.props.meter,
					gps: undefined
				};
				this.props.editMeterDetails(editedMeter);
			} else if (isValidGPSInput(input)) {
				const latitudeIndex = 0;
				const longitudeIndex = 1;
				const array = input.split(',').map((value: string) => parseFloat(value));
				const gps: GPSPoint = {
					longitude: array[longitudeIndex],
					latitude: array[latitudeIndex]
				};
				const editedMeter = {
					...this.props.meter,
					gps
				};
				this.props.editMeterDetails(editedMeter);
			} else {
				this.props.log('info', 'refused gps coordinates with invalid input');
				const originalGPS = this.props.meter.gps;
				this.setState({ gpsInput: (originalGPS) ? `${originalGPS.longitude},${originalGPS.latitude}` : '' });
			}
		}
		this.setState({ gpsFocus: !this.state.gpsFocus });
	}

	private handleGPSChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
		this.setState({ gpsInput: event.target.value });
	}

	/** This function and toggleGPSInput will be utilized in the future when GPS changes are to be saved
	 * See toggleIdentifierInput and formatIdentifierInput for Example
	 */
	private formatGPSInput() {
		let formattedGPS;
		let buttonMessageId;
		if (this.state.gpsFocus) {
		} else {
			formattedGPS = <div>{this.state.gpsInput}</div>;
		}

		let toggleButton;
		const loggedInAsAdmin = this.props.loggedInAsAdmin;
		if (loggedInAsAdmin) {

		} else {
			toggleButton = <div />;
		}

		if (loggedInAsAdmin) {
			return ( // add onClick
				<div>
					{formattedGPS}
					{toggleButton}
				</div>
			);
		} else {
			return (
				<div>
					{this.state.gpsInput}
					{toggleButton}
				</div>
			);
		}
	}

	private handleIdentifierChange(event: React.ChangeEvent<HTMLInputElement>) {
		this.setState({ identifierInput: event.target.value });
		this.setState({ identifierFocus: true });
	}

	private toggleIdentifierInput() {
		if (this.state.identifierFocus) {
			const identifier = this.state.identifierInput;

			const editedMeter = {
				...this.props.meter,
				identifier
			};
			this.props.editMeterDetails(editedMeter);
		}
		this.setState({ identifierFocus: false });
	}

	private formatIdentifierInput() {
		let formattedIdentifier;
		if (this.state.identifierFocus) {
			formattedIdentifier = <div>{this.state.identifierInput}</div>;
		} else {
			formattedIdentifier = <div>{this.props.meter.identifier}</div>;
		}
		const loggedInAsAdmin = this.props.loggedInAsAdmin;

		if (loggedInAsAdmin) {
			return (
				<div>
					{formattedIdentifier}
				</div>
			);
		} else {
			return (
				<div>
					{this.state.identifierInput}
				</div>
			);
		}
	}
}

export default injectIntl(MeterViewComponent);