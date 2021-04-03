/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button, Input, Form, FormGroup, Label } from 'reactstrap';
import { MetersCSVUploadProps } from 'types/csvUploadForm';
import { showErrorNotification } from '../../utils/notifications';
import FormFileUploaderComponent from '../FormFileUploaderComponent';
import translate from '../../utils/translate';

export default class MetersCSVUploadComponent extends React.Component<MetersCSVUploadProps> {
	private fileInput: React.RefObject<HTMLInputElement>;
	constructor(props: MetersCSVUploadProps) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.fileInput = React.createRef();
	}

	private async handleSubmit(e: React.MouseEvent<HTMLFormElement>) {
		try {
			e.preventDefault();
			await this.props.submitCSV(this.fileInput.current.files[0]); // Not sure how to respond to this typescript error.
			// Respond to success.
		} catch (error) {
			// A failed axios request should result in an error.
			showErrorNotification(translate(error.response.data as string), undefined, 10);
		}
	}

	public render() {
		return (
			<Form onSubmit={this.handleSubmit}>
				<FormGroup>
					<Input checked={this.props.gzip} type='checkbox' name='gzip' id='gzip' onChange={this.props.toggleGzip} />
					<Label for='gzip'> Gzip </Label>
				</FormGroup>
				<FormGroup>
					<Input checked={this.props.headerRow} type='checkbox' name='headerRow' id='headerRow' onChange={this.props.toggleHeaderRow} />
					<Label for='headerRow'> Header Row </Label>
				</FormGroup>
				<FormGroup>
					<Input checked={this.props.update} type='checkbox' name='update' id='update' onChange={this.props.toggleUpdate} />
					<Label for='update'> Update </Label>
					<FormFileUploaderComponent buttonText='Upload Meters CSV' id='uploadMeters' reference={this.fileInput} required />
				</FormGroup>
				<Button type='submit'> Submit CSV Data </Button>
			</Form>
		)
	}

}