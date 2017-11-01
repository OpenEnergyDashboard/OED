/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import Dropzone from 'react-dropzone';
import axios from 'axios';
import MeterDropDownContainer from '../containers/MeterDropdownContainer';
import HeaderContainer from '../containers/HeaderContainer';

export default class AdminComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleOnDrop = this.handleOnDrop.bind(this);
	}

	handleOnDrop(files) {
		const file = files[0];
		const data = new FormData();
		data.append('csvFile', file);
		axios.post(`/api/fileProcessing/${this.props.meterID}`, data)
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

	render() {
		return (
			<div>
				<HeaderContainer renderLoginButton={false} renderOptionsButton={false} renderAdminButton={false} />
				<Dropzone onDrop={this.handleOnDrop}>
					<div> Add in a CSV file here:</div>
				</Dropzone>
				<MeterDropDownContainer />
			</div>
		);
	}
}
