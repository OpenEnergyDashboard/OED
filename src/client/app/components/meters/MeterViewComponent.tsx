/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button } from 'reactstrap';
import ListDisplayComponent from '../ListDisplayComponent';
import { Link } from 'react-router';
import { hasToken } from '../../utils/token';
import { FormattedMessage } from 'react-intl';
import { MeterMetadata, EditMeterDetailsAction } from '../../types/redux/meters';
import {GPSPoint, isValidGPSInput} from '../../utils/calibration';

interface MeterViewProps {
	// The ID of the meter to be displayed
	id: number;
	// The meter metadata being displayed by this row
	meter: MeterMetadata;
	isEdited: boolean;
	isSubmitting: boolean;
	// The function used to dispatch the action to edit meter details
	editMeterDetails(meter: MeterMetadata): EditMeterDetailsAction;
	log(level: string, message: string): any;
}

interface MeterViewState {
	gpsFocus: boolean;
	gpsInput: string;
}

export default class MeterViewComponent extends React.Component<MeterViewProps, MeterViewState> {
	constructor(props: MeterViewProps) {
		super(props);
		this.state = {
			gpsFocus: false,
			gpsInput: (this.props.meter.gps) ? `${this.props.meter.gps.longitude},${this.props.meter.gps.latitude}` : ''
		};
		this.toggleMeterDisplayable = this.toggleMeterDisplayable.bind(this);
		this.toggleMeterEnabled = this.toggleMeterEnabled.bind(this);
		this.toggleGPSInput = this.toggleGPSInput.bind(this);
		this.handleGPSChange = this.handleGPSChange.bind(this);
	}

	public render() {
		const renderEditButton = true;
		const editButtonStyle: React.CSSProperties = {
			display: renderEditButton ? 'inline' : 'none',
			paddingLeft: '5px'
		};
		return (
			<tr>
				<td> {this.props.meter.id} {this.formatStatus()} </td>
				<td> {this.props.meter.name} </td>
				{hasToken() && <td> {this.props.meter.meterType} </td>}
				{hasToken() && <td> {this.props.meter.ipAddress} </td>}
				{hasToken() && <td> {this.formatGPSInput()} </td>}
				<td> {this.formatEnabled()} </td>
				<td> {this.formatDisplayable()} </td>
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
		if (hasToken()) {
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
		if (hasToken()) {
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
				this.setState({gpsInput: (originalGPS) ? `${originalGPS.longitude},${originalGPS.latitude}` : ''});
			}
		}
		this.setState({gpsFocus: !this.state.gpsFocus});
	}

	private handleGPSChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
		this.setState({ gpsInput: event.target.value});
	}

	private formatGPSInput() {
		let formattedGPS;
		let buttonMessageId;
		if (this.state.gpsFocus) {
			formattedGPS = <textarea id={'gps'} value={this.state.gpsInput} onChange={event => this.handleGPSChange(event)}/>;
			buttonMessageId = 'update';
		} else {
			formattedGPS = <div>{this.state.gpsInput}</div>;
			buttonMessageId = 'edit';
		}

		let toggleButton;
		if (hasToken()) {
			toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.toggleGPSInput}>
				<FormattedMessage id={buttonMessageId} />
			</Button>;
		} else {
			toggleButton = <div />;
		}

		if (hasToken()) {
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
}

