/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button } from 'reactstrap';
import ListDisplayComponent from '../ListDisplayComponent';
import { Link } from 'react-router';
import { hasToken } from '../../utils/token';
import { FormattedMessage } from 'react-intl';
import { MeterMetadata } from '../../types/redux/meters';

type MeterViewProps = MeterMetadata;

export default class MeterViewComponent extends React.Component<MeterViewProps, {}> {
	constructor(props: MeterViewProps) {
		super(props);
	}

	public render() {
		const renderEditButton = true;
		const editButtonStyle: React.CSSProperties = {
			display: renderEditButton ? 'inline' : 'none',
			paddingLeft: '5px'
		};
		return (
			<tr>
				<td> {this.props.id} </td>
				<td> {this.props.name} </td>
				<td> {this.formatMeterType()} </td>
				<td> {this.formatMeterAddress()} </td>
				<td> {this.formatEnabled()} </td>
				<td> {this.formatDisplayable()} </td>
			</tr>
		);
	}

	private styleEnabled(): React.CSSProperties {
		return { color: 'green' };
	}

	private styleDisabled(): React.CSSProperties {
			return { color: 'red' };
	}

	private styleToggleBtn(): React.CSSProperties {
		return { float: "right" };
	}

	private formatMeterType() {
		if (this.props.meterType) {
			return this.props.meterType;
		} else {
			return ( <span style={this.styleDisabled()}>
				<FormattedMessage id='admin.only' />
				</span>
			);
		}
	}

	private formatMeterAddress() {
		if (this.props.ipAddress) {
			return this.props.ipAddress;
		} else {
			return ( <span style={this.styleDisabled()}>
				<FormattedMessage id='admin.only' />
				</span>
			);
		}
	}

	private formatDisplayable() {
		let styleFn;
		let messageId;
		let buttonMessageId;

		if (this.props.displayable) {
			styleFn = this.styleEnabled;
			messageId = 'meter.is.displayable';
			buttonMessageId = 'hide';
		} else {
			styleFn = this.styleDisabled;
			messageId = 'meter.is.not.displayable';
			buttonMessageId = 'show';
		};

		let toggleButton;
		if (hasToken()) {
			toggleButton = <Button style={this.styleToggleBtn()} color="primary">
				<FormattedMessage id={buttonMessageId} />
				</Button>;
		} else {
			toggleButton = <div> </div>;
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

		if (this.props.displayable) {
			styleFn = this.styleEnabled;
			messageId = 'meter.is.enabled';
			buttonMessageId = 'disable';
		} else {
			styleFn = this.styleDisabled;
			messageId = 'meter.is.not.enabled';
			buttonMessageId = 'enable';
		};

		let toggleButton;
		if (hasToken()) {
			toggleButton = <Button style={this.styleToggleBtn()}color="primary">
				<FormattedMessage id={buttonMessageId} />
				</Button>;
		} else {
			toggleButton = <div> </div>;
		}

		return (
			<span>
				<span style={styleFn()}>
					<FormattedMessage id={messageId} />
				</span>
				{ toggleButton }
			</span>
		);

	}
}

