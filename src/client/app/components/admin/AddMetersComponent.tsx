
/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import Dropzone from 'react-dropzone';
import axios from 'axios';
import { getToken } from '../../utils/token';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';

export default class AddMetersComponent extends React.Component<{}, {}> {
	constructor(props: {}) {
		super(props);
		this.handleMeterToImport = this.handleMeterToImport.bind(this);
	}

	public handleMeterToImport(files: File[]) {
		const file = files[0];
		let jsonObject = [];
		const reader = new FileReader();
		let listValue = [];
		reader.onload = () => {
			const fileAsBinaryString = reader.result;
			listValue = fileAsBinaryString.split(/\r?\n/);
			for (const items of listValue) {
				if (items.length === 0) {
					listValue.splice(listValue.indexOf(items), 1);
				}
			}
			jsonObject = listValue;
			axios({
				method: 'post',
				url: '/api/fileProcessing/meters',
				data: jsonObject,
				params: {
					token: getToken()
				}
			})
			.then(() => {
				showSuccessNotification('Successfully uploaded meters');
			})
			.catch(() => {
				showErrorNotification('Error uploading meters');
			});
		};
		reader.onabort = () => showErrorNotification('File reading was aborted');
		reader.onerror = () => showErrorNotification('File reading has failed');
		reader.readAsBinaryString(file);
	}

	public render() {
		const titleStyle: React.CSSProperties = {
			fontWeight: 'bold',
			margin: 0,
			paddingBottom: '5px'
		};

		return (
			<div>
				<p style={titleStyle}> Add new meters: </p>
				<Dropzone accept='text/csv, application/vnd.ms-excel,' onDrop={this.handleMeterToImport}>
					<div>Upload meters list (CSV):</div>
				</Dropzone>
			</div>
		);
	}
}
