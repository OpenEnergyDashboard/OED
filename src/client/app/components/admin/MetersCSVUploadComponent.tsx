/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button, Col, Input, Form, FormGroup, Label } from 'reactstrap';
import { MetersCSVUploadProps } from 'types/csvUploadForm';
import { showErrorNotification } from '../../utils/notifications';
import FormFileUploaderComponent from '../FormFileUploaderComponent';
import translate from '../../utils/translate';

export default class MetersCSVUploadComponent extends React.Component<MetersCSVUploadProps> {
	private fileInput: React.RefObject<HTMLInputElement>;

	constructor(props: MetersCSVUploadProps) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.fileInput = React.createRef<HTMLInputElement>();
	}

	private async handleSubmit(e: React.MouseEvent<HTMLFormElement>) {
		try {
			e.preventDefault();
			const current = this.fileInput.current as HTMLInputElement;
			const { files } = current;
			if (files && (files as FileList).length !== 0) {
				await this.props.submitCSV(files[0]);
			} else {
				showErrorNotification(translate('No Meters CSV File was uploaded!'), undefined, 10);
			}
			// Respond to success.
		} catch (error) {
			// A failed axios request should result in an error.
			showErrorNotification(translate(error.response.data as string), undefined, 10);
		}
	}

	public render() {
		const titleStyle: React.CSSProperties = {
			fontWeight: 'bold',
			margin: 0,
			paddingBottom: '5px',
			textAlign: 'right'
		};

		const checkboxStyle: React.CSSProperties = {
			textAlign: 'right'
		}

		return (
			<Form onSubmit={this.handleSubmit} style={{ padding: '20px' }}>
				<FormFileUploaderComponent buttonText='Upload Meters CSV' reference={this.fileInput} required labelStyle={titleStyle} />
				<FormGroup row>
					<Col sm={2} style={checkboxStyle}>
						<Input checked={this.props.gzip} type='checkbox' name='gzip' onChange={this.props.toggleGzip} id='metersGzip' />
					</Col>
					<Label htmlFor='metersGzip' sm={10}>
						Gzip
					</Label>
				</FormGroup>
				<FormGroup row>
					<Col sm={2} style={checkboxStyle}>
						<Input checked={this.props.headerRow} type='checkbox' name='headerRow' onChange={this.props.toggleHeaderRow} id='metersHeaderRowMeter' />
					</Col>
					<Label htmlFor='metersHeaderRowMeter' sm={10}> Header Row </Label>
				</FormGroup>
				<FormGroup row>
					<Col sm={2} style={checkboxStyle}>
						<Input checked={this.props.update} type='checkbox' name='update' onChange={this.props.toggleUpdate} id='metersUpdate' />
					</Col>
					<Label htmlFor='metersUpdate' sm={10}> Update </Label>
				</FormGroup>
				<Button type='submit'> Submit CSV Data </Button>
			</Form>
		)
	}

}