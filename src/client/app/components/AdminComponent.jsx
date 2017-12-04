/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import Dropzone from 'react-dropzone';
import axios from 'axios';
import MultiSelectComponent from './MultiSelectComponent';
import HeaderContainer from '../containers/HeaderContainer';
import getToken from "../utils/getToken";

export default class AdminComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleFileToImport = this.handleFileToImport.bind(this);
	}

	handleFileToImport(files) {
		//token passed as a header
		if (!this.props.selectedImportMeter) {
			this.props.showNotification({
				message: 'Please select a meter',
				level: 'error',
				position: 'tr',
				autoDismiss: 3
			});
		} else {
			const file = files[0];
			const data = new FormData();
			data.append('csvFile', file);
			// data.append('token', getToken());
			axios({
				method: 'post',
				url: `/api/fileProcessing/${this.props.selectedImportMeter.value}`,
				data,
				params: {
					token: getToken()
				}
			})
			// axios.post(`/api/fileProcessing/${this.props.selectedImportMeter.value}`, data)
				.then(() => {
					this.props.showNotification({
						message: 'Successfully uploaded meter data',
						level: 'success',
						position: 'tr',
						autoDismiss: 3
					});
				})
				.catch(() => {
					this.props.showNotification({
						message: 'Error uploading meter data',
						level: 'error',
						position: 'tr',
						autoDismiss: 3
					});
				});
		}
	}

	render() {
		return (
			<div>
				<HeaderContainer renderLoginButton={false} renderOptionsButton={false} renderAdminButton={false} />
				<div className="container-fluid">
					<div className="col-xs-4">
						<Dropzone accept = "text/csv, application/vnd.ms-excel,"
								  onDrop = {this.handleFileToImport}>
							<div> Add in a CSV file here:</div>
						</Dropzone>
						<MultiSelectComponent
							options={this.props.meters}
							selectedOptions={this.props.selectedImportMeter}
							placeholder="Select meter to import data"
							onValuesChange={s => this.props.updateSelectedImportMeter(s)}
						/>
					</div>
				</div>
			</div>
		);
	}
}
