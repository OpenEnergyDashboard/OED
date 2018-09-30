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

		if (this.props.displayable) {
			return ( <span style={this.styleEnabled()}>
				<FormattedMessage id='meter.is.displayable' />
				</span>
			);
		} else {
			return ( <span style={this.styleDisabled()}>
				<FormattedMessage id='meter.is.not.displayable' />
			</span> );
		}
	}

	private formatEnabled() {
		if (this.props.enabled) {
			return ( <span style={this.styleEnabled()}>
				<FormattedMessage id='meter.is.enabled' />
				</span>
			);
		} else {
			return ( <span style={this.styleDisabled()}>
				<FormattedMessage id='meter.is.not.enabled' />
			</span> );
		}
	}
}

