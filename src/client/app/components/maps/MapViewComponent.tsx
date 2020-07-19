/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button } from 'reactstrap';
import ListDisplayComponent from '../ListDisplayComponent';
import { Link } from 'react-router';
import { hasToken } from '../../utils/token';
import { FormattedMessage } from 'react-intl';
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
}

export default class MapViewComponent extends React.Component<MapViewProps, {}> {
	constructor(props: MapViewProps) {
		super(props);
		this.toggleMapDisplayable = this.toggleMapDisplayable.bind(this);
	}

	public render() {
		const renderEditButton = true;
		const editButtonStyle: React.CSSProperties = {
			display: renderEditButton ? 'inline' : 'none',
			paddingLeft: '5px'
		};
		console.log(`${this.props.map.modifiedDate}, ${typeof this.props.map.modifiedDate}`);
		return (
			<tr>
				<td> {this.props.map.id} {this.formatStatus()} </td>
				<td> {this.props.map.name} </td>
				{hasToken() && <td> {this.formatDisplayable()} </td>}
				{hasToken() && <td> {moment(this.props.map.modifiedDate).format('dddd, MMM DD, YYYY hh:mm a')} </td>}
				{hasToken() && <td> {this.formatFilename()} </td>}
				{hasToken() && <td> {this.props.map.note} </td>}
				{hasToken() && <td> {this.formatCalibrationStatus()} </td>}
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

	private toggleMapDisplayable() {
		const editedMap = this.props.map;
		editedMap.displayable = !editedMap.displayable;
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

	private formatName

	private styleCalibrated(): React.CSSProperties {
		return { color: 'black' };
	}

	private styleNotCalibrated(): React.CSSProperties {
		return { color: 'gray' };
	}

	private formatCalibrationStatus() {
		const linkAddress = `/${this.props.map.id}_${CalibrationModeTypes.calibrate}`;
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
				<Link to={linkAddress}><Button style={this.styleToggleBtn()} color='primary'>
					<FormattedMessage id='map.calibrate' />
				</Button></Link>
			</span>
		);
	}

	private formatFilename() {
		const linkAddress = `/maps/${this.props.map.id}_${CalibrationModeTypes.initiate}`;
		return (
			<span>
				<span>{this.props.map.filename}</span>
				<Link to={linkAddress}><Button style={this.styleToggleBtn()} color='primary'>
					<FormattedMessage id='map.upload.new.file' />
				</Button></Link>
			</span>
		);
	}
}

