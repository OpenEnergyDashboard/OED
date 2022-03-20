/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button } from 'reactstrap';
import { FormattedMessage, injectIntl, WrappedComponentProps } from 'react-intl';
import { MeterMetadata, EditMeterDetailsAction } from '../../types/redux/meters';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import TimeZoneSelect from '../TimeZoneSelect';
import { updateUnsavedChanges } from '../../actions/unsavedWarning';
import { fetchMetersDetails, submitEditedMeters, confirmEditedMeters } from '../../actions/meters';
import store from '../../index';

interface MeterViewProps {
	// The ID of the meter to be displayed
	id: number;
	// The meter metadata being displayed by this row
	meter: MeterMetadata;
	isEdited: boolean;
	isSubmitting: boolean;
	loggedInAsAdmin: boolean;
	// The function used to dispatch the action to edit meter details
	editMeterDetails(meter: MeterMetadata): EditMeterDetailsAction;
	log(level: string, message: string): any;
}

interface MeterViewState {
	gpsFocus: boolean;
	gpsInput: string;
	identifierFocus: boolean;
	identifierInput: string;
}

type MeterViewPropsWithIntl = MeterViewProps & WrappedComponentProps;

class MeterViewComponent extends React.Component<MeterViewPropsWithIntl, MeterViewState> {
	constructor(props: MeterViewPropsWithIntl) {
		super(props);
		this.state = {
			gpsFocus: false,
			gpsInput: (this.props.meter.gps) ? `${this.props.meter.gps.latitude},${this.props.meter.gps.longitude}` : '',
			identifierFocus: false,
			identifierInput: this.props.meter.identifier
		};
		this.toggleMeterDisplayable = this.toggleMeterDisplayable.bind(this);
		this.toggleMeterEnabled = this.toggleMeterEnabled.bind(this);
		this.toggleGPSInput = this.toggleGPSInput.bind(this);
		this.handleGPSChange = this.handleGPSChange.bind(this);
		this.changeTimeZone = this.changeTimeZone.bind(this);
		this.toggleIdentifierInput = this.toggleIdentifierInput.bind(this);
		this.handleIdentifierChange = this.handleIdentifierChange.bind(this);
	}

	public render() {
		const loggedInAsAdmin = this.props.loggedInAsAdmin;
		return (
			<tr>
				{loggedInAsAdmin && <td> {this.props.meter.id} {this.formatStatus()} </td>}
				{loggedInAsAdmin && <td> {this.props.meter.name} </td>}
				<td> {this.formatIdentifierInput()} </td>
				{loggedInAsAdmin && <td> {this.props.meter.meterType} </td>}
				{loggedInAsAdmin && <td> {this.props.meter.ipAddress} </td>}
				{loggedInAsAdmin && <td> {this.formatGPSInput()} </td>}
				<td> {this.formatEnabled()} </td>
				<td> {this.formatDisplayable()} </td>
				{loggedInAsAdmin && <td> <TimeZoneSelect current={this.props.meter.timeZone || ''} handleClick={this.changeTimeZone} /> </td>}
			</tr>
		);
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

	private formatStatus(): string {
		if (this.props.isSubmitting) {
			return '(' + this.props.intl.formatMessage({id: 'submitting'}) + ')';
		}

		if (this.props.isEdited) {
			return this.props.intl.formatMessage({id: 'edited'});
		}

		return '';
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
		let styleFn;
		let messageId;
		let buttonMessageId;

		if (this.props.meter.displayable) {
			styleFn = this.styleEnabled;
			messageId = 'meter.is.displayable';
			buttonMessageId = 'hide';
		} else {
			styleFn = this.styleDisabled;
			messageId = 'meter.is.not.displayable';
			buttonMessageId = 'show';
		}

		let toggleButton;
		const loggedInAsAdmin = this.props.loggedInAsAdmin;
		if (loggedInAsAdmin) {
			toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.toggleMeterDisplayable}>
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

	private formatEnabled() {
		let styleFn;
		let messageId;
		let buttonMessageId;

		if (this.props.meter.enabled) {
			styleFn = this.styleEnabled;
			messageId = 'meter.is.enabled';
			buttonMessageId = 'disable';
		} else {
			styleFn = this.styleDisabled;
			messageId = 'meter.is.not.enabled';
			buttonMessageId = 'enable';
		}

		let toggleButton;
		const loggedInAsAdmin = this.props.loggedInAsAdmin;
		if (loggedInAsAdmin) {
			toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.toggleMeterEnabled}>
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

	private formatGPSInput() {
		let formattedGPS;
		let buttonMessageId;
		if (this.state.gpsFocus) {
			// default value for autoFocus is true and for all attributes that would be set autoFocus={true}
			formattedGPS = <textarea id={'gps'} autoFocus value={this.state.gpsInput} onChange={event => this.handleGPSChange(event)} />;
			buttonMessageId = 'update';
		} else {
			formattedGPS = <div>{this.state.gpsInput}</div>;
			buttonMessageId = 'edit';
		}

		let toggleButton;
		const loggedInAsAdmin = this.props.loggedInAsAdmin;
		if (loggedInAsAdmin) {
			toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.toggleGPSInput}>
				<FormattedMessage id={buttonMessageId} />
			</Button>;
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

	private toggleIdentifierInput() {
		if (this.state.identifierFocus) {
			const identifier = this.state.identifierInput;

			const editedMeter = {
				...this.props.meter,
				identifier
			};
			this.props.editMeterDetails(editedMeter);
		}
		this.setState({ identifierFocus: !this.state.identifierFocus });
	}

	private handleIdentifierChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
		this.setState({ identifierInput: event.target.value });
	}

	private formatIdentifierInput(){
		let formattedIdentifier;
		let buttonMessageId;
		if(this.state.identifierFocus){
			formattedIdentifier = <textarea
				id={'identifier'}
				autoFocus
				value={this.state.identifierInput}
				onChange={event => this.handleIdentifierChange(event)}
			/>;
			buttonMessageId = 'update';
		} else {
			formattedIdentifier = <div>{this.state.identifierInput}</div>;
			buttonMessageId = 'edit';
		}

		let toggleButton;
		const loggedInAsAdmin = this.props.loggedInAsAdmin;
		if (loggedInAsAdmin) {
			toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.toggleIdentifierInput}>
				<FormattedMessage id={buttonMessageId} />
			</Button>;
		} else {
			toggleButton = <div />;
		}

		if (loggedInAsAdmin) {
			return ( // add onClick
				<div>
					{formattedIdentifier}
					{toggleButton}
				</div>
			);
		} else {
			return (
				<div>
					{this.state.identifierInput}
					{toggleButton}
				</div>
			);
		}
	}
}

export default injectIntl(MeterViewComponent);