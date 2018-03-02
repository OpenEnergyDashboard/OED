/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import Dropzone from 'react-dropzone';
import axios from 'axios';
import MultiSelectComponent from '../MultiSelectComponent';
import { getToken } from '../../utils/token';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';

export default class addReadings extends React.Component {
	constructor(props) {
		super(props);
		this.handleFileToImport = this.handleFileToImport.bind(this);
	}

	handleFileToImport(files) {
		// token passed as a header
		if (!this.props.selectedImportMeter) {
			showErrorNotification('Please select a meter');
		} else {
			const file = files[0];
			const data = new FormData();
			data.append('csvFile', file);
			console.log(data);
			axios({
				method: 'post',
				url: `/api/fileProcessing/readings/${this.props.selectedImportMeter.value}`,
				data,
				params: {
					token: getToken()
				}
			})
				.then(() => {
					showSuccessNotification('Successfully uploaded meter data');
				})
				.catch(() => {
					showErrorNotification('Error uploading meter data');
				});
		}
	}

	render() {
		const titleStyle = {
			fontWeight: 'bold',
			margin: 0,
			paddingBottom: '5px'
		};
		const smallMarginBottomStyle = {
			marginBottom: '5px'
		};
		return (
			<div>
				<p style={titleStyle}>Import readings for a selected meter:</p>
				<MultiSelectComponent
					style={smallMarginBottomStyle}
					options={this.props.meters}
					selectedOptions={this.props.selectedImportMeter}
					placeholder="Select meter to import data"
					onValuesChange={s => this.props.updateSelectedImportMeter(s)}
					singleSelect
				/>
				{this.props.selectedImportMeter &&
				<Dropzone accept="text/csv, application/vnd.ms-excel," onDrop={this.handleFileToImport}>
					<div>Upload readings (CSV):</div>
				</Dropzone>
				}
			</div>
		);
	}
}
