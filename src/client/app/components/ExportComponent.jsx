/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import moment from 'moment';
import graphExport from '../services/exportData';

export default class ExportComponent extends React.Component {
	/**
	 * Initializes the component's state, binds all functions to 'this' ExportComponent
	 * @param props The props passed down through the UIOptionsContainer
	 */
	constructor(props) {
		super(props);
		this.exportReading = this.exportReading.bind(this);
	}

	/**
	 * Called when Export button is clicked.
	 * Passes an object containing the selected meter data to a function for export.
	 */
	exportReading() {
		const compressedData = this.props.exportVals.datasets;
		let time = compressedData[0].exportVals[0].x;
		time = moment(time).format('ddddMMMDDYYYY');
		const name = `oedExport${time}.csv`;
		graphExport(compressedData,	name);
	}

	render() {
		return (<button onClick={this.exportReading}>Export!</button>);
	}
}
