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
import TimeZoneSelect from '../TimeZoneSelect';

interface MeterViewProps {
	// The ID of the meter to be displayed
	id: number;
	// The meter metadata being displayed by this row
	meter: MeterMetadata;
	isEdited: boolean;
	isSubmitting: boolean;
	// The function used to dispatch the action to edit meter details
	editMeterDetails(meter: MeterMetadata): EditMeterDetailsAction;
}

export default class MeterViewComponent extends React.Component<MeterViewProps, {}> {
	constructor(props: MeterViewProps) {
		super(props);
		this.toggleMeterDisplayable = this.toggleMeterDisplayable.bind(this);
		this.toggleMeterEnabled = this.toggleMeterEnabled.bind(this);
		this.changeTimeZone = this.changeTimeZone.bind(this);
	}

	public render() {
		const renderEditButton = true;
		const editButtonStyle: React.CSSProperties = {
			display: 'inline',
			paddingLeft: '5px'
		};
		return (
			<tr>
				<td> {this.props.meter.id} {this.formatStatus()} </td>
				<td> {this.props.meter.name} </td>
				{hasToken() && <td> {this.props.meter.meterType} </td>}
				{hasToken() && <td> {this.props.meter.ipAddress} </td>}
				<td> {this.formatEnabled()} </td>
				<td> {this.formatDisplayable()} </td>
				{hasToken() && <td> <TimeZoneSelect current={this.props.meter.timeZone || ''} handleClick={this.changeTimeZone} /> </td>}
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
}

