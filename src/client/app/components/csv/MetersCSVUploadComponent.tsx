/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button, Input, Form, FormGroup, Label } from 'reactstrap';
import { MetersCSVUploadProps } from '../../types/csvUploadForm';
import FormFileUploaderComponent from '../FormFileUploaderComponent';
import { FormattedMessage } from 'react-intl';
import { MODE } from '../../containers/csv/UploadCSVContainer';
import { fetchMetersDetails } from '../../actions/meters';
import store from '../../index';

export default class MetersCSVUploadComponent extends React.Component<MetersCSVUploadProps> {
	private fileInput: React.RefObject<HTMLInputElement>;

	constructor(props: MetersCSVUploadProps) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleSetMeterName = this.handleSetMeterName.bind(this);
		this.fileInput = React.createRef<HTMLInputElement>();
	}

	private async handleSubmit(e: React.MouseEvent<HTMLFormElement>) {
		try {
			e.preventDefault();
			const current = this.fileInput.current as HTMLInputElement;
			const { files } = current;
			if (files && (files as FileList).length !== 0) {
				await this.props.submitCSV(files[0])
				// TODO Using an alert is not the best. At some point this should be integrated
				// with react.
				window.alert('<h1>SUCCESS</h1>The meter upload was a success.');
			}
		} catch (error) {
			// A failed axios request should result in an error.
			window.alert(error.response.data as string);
		}
		// Refetch meters details.
		store.getState().meters.hasBeenFetchedOnce = false;
		fetchMetersDetails();
	}

	private handleSetMeterName(e: React.ChangeEvent<HTMLInputElement>) {
		const target = e.target;
		this.props.setMeterName(MODE.meters, target.value);
	}

	public render() {
		const titleStyle: React.CSSProperties = {
			fontWeight: 'bold',
			paddingBottom: '5px'
		};

		const checkboxStyle: React.CSSProperties = {
			paddingBottom: '15px'
		}

		const formStyle: React.CSSProperties = {
			display: 'flex',
			justifyContent: 'center',
			padding: '20px'
		}

		return (
			<div style={formStyle}>
				<Form onSubmit={this.handleSubmit}>
					<FormFileUploaderComponent formText='csv.upload.meters' reference={this.fileInput} required labelStyle={titleStyle} />
					<FormGroup check style={checkboxStyle}>
						<Label>
							<Input checked={this.props.gzip} type='checkbox' name='gzip' onChange={this.props.toggleGzip} />
							<FormattedMessage id='csv.common.param.gzip' />
						</Label>
					</FormGroup>
					<FormGroup check style={checkboxStyle}>
						<Label check>
							<Input checked={this.props.headerRow} type='checkbox' name='headerRow' onChange={this.props.toggleHeaderRow} />
							<FormattedMessage id='csv.common.param.header.row' />
						</Label>
					</FormGroup>
					<FormGroup check style={checkboxStyle}>
						<Label check>
							<Input checked={this.props.update} type='checkbox' name='update' onChange={this.props.toggleUpdate} />
							<FormattedMessage id='csv.common.param.update' />
						</Label>
					</FormGroup>
					<FormGroup>
						<Label style={titleStyle}>
							<FormattedMessage id='csv.readings.param.meter.name' />
						</Label>
						<Input value={this.props.meterName} name='meterName' onChange={this.handleSetMeterName} />
					</FormGroup>
					<Button color='secondary' type='submit'>
						<FormattedMessage id='csv.submit.button' />
					</Button>
				</Form>
			</div>
		)
	}

}