/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { Button } from 'reactstrap';
import moment from 'moment';
import graphExport from '../utils/exportData';

const ExportComponent = props => {
	/**
	 * Called when Export button is clicked.
	 * Passes an object containing the selected meter data to a function for export.
	 */
	const exportReading = () => {
		const compressedData = props.exportVals.datasets;

		// Determine and format the first time in the dataset
		let startTime = moment(compressedData[0].exportVals[0].x);
		for (const reading of compressedData) {
			if (reading !== undefined) {
				const startTimeOfDataset = moment(reading.exportVals[0].x);
				if (startTime.isAfter(startTimeOfDataset)) {
					startTime = startTimeOfDataset;
				}
			}
		}
		const startTimeString = startTime.format('YYYY-MMM-DD-dddd');

		// Determine and format the last time in the dataset
		let endTime = moment(compressedData[0].exportVals[compressedData[0].exportVals.length - 1].x);
		for (const reading of compressedData) {
			if (reading !== undefined) {
				const endTimeOfDataset = moment(reading.exportVals[reading.exportVals.length - 1].x);
				if (endTimeOfDataset.isAfter(endTime)) {
					endTime = endTimeOfDataset;
				}
			}
		}
		const endTimeString = endTime.format('YYYY-MMM-DD-dddd');

		const chartName = compressedData[0].currentChart;
		const name = `oedExport_${chartName}_${startTimeString}_to_${endTimeString}.csv`;
		graphExport(compressedData,	name);
	};
	return (
		<div>
			<Button outline onClick={exportReading}>Export graph data</Button>
		</div>
	);
};
export default ExportComponent;
