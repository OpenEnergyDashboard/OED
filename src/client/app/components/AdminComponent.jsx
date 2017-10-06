/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import Dropzone from 'react-dropzone';
import axios from 'axios';
import MeterDropDownContainer from '../containers/MeterDropdownContainer';


export default class AdminComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleOnDrop = this.handleOnDrop.bind(this);
	}


	handleOnDrop(files) {
		const file = files[0];
		console.log(file);
		const data = new FormData();
		data.append('csvFile', file);
		axios.post(`/api/fileProcessing/${this.props.meterID}`, data)
			.then(response => {
				console.log(response);
			})
			.catch(console.log);
	}

	render() {
		return (
			<div>
				<p>Admin panel</p>
				<button>AddMeter</button>
				<Dropzone onDrop={this.handleOnDrop}>
					<div> Add in a CSV file here:</div>
				</Dropzone>
				<MeterDropDownContainer />
			</div>
		);
	}
}
