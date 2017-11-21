/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import Dropzone from 'react-dropzone';
import axios from 'axios';
import MultiSelectComponent from './MultiSelectComponent';
import getToken from '../utils/getToken';
import HeaderContainer from '../containers/HeaderContainer';

export default class AdminComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleFileToImport = this.handleFileToImport.bind(this);
	}

	handleFileToImport(files) {
		const data = new FormData();
		data.append('csvFile', files[0]);
		data.append('token', getToken());
		axios.post(`/api/fileProcessing/${this.props.selectedImportMeter.value}`, data)
		.then(() => {
			this.props.showNotification({
				message: 'Successfully uploaded meter data',
				level: 'success',
				position: 'tr',
				autoDismiss: 3
			});
		}).catch(() => {
			this.props.showNotification({
				message: 'Error uploading meter data',
				level: 'error',
				position: 'tr',
				autoDismiss: 3
			});
		});
	}

	render() {
		let selectedImportMeter = {};
		if (this.props.selectedImportMeter) {
			selectedImportMeter = this.props.selectedImportMeter;
		}
		return (
			<div>
				<HeaderContainer renderLoginButton={false} renderOptionsButton={false} renderAdminButton={false} />
				<div className="container-fluid">
					<div className="col-xs-4">
						<Dropzone onDrop={this.handleFileToImport}>
							<div> Add in a CSV file here:</div>
						</Dropzone>
						<MultiSelectComponent
							options={this.props.meters}
							selectedOptions={selectedImportMeter}
							placeholder="Select meter to import data"
							onValuesChange={s => this.props.updateSelectedImportMeter(s)}
						/>
					</div>
				</div>
			</div>
		);
	}
}
