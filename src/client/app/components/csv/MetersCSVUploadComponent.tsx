/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button, Input, Form, FormGroup, Label } from 'reactstrap';
import { MetersCSVUploadProps } from '../../types/csvUploadForm';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import FormFileUploaderComponent from '../FormFileUploaderComponent';
import translate from '../../utils/translate';
import { FormattedMessage } from 'react-intl';

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
				showSuccessNotification(translate('csv.success.upload.meters'));
			}
		} catch (error) {
			// A failed axios request should result in an error.
			showErrorNotification(translate(error.response.data as string), undefined, 10);
		}
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
					<Button type='submit'>
						<FormattedMessage id='csv.submit.button' />
					</Button>
				</Form>
			</div>
		)
	}

}