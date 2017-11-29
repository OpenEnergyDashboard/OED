/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button } from 'react-bootstrap';
import * as moment from 'moment';
import graphExport from '../services/exportData';
import { ExportDataSet } from '../types/readings';

interface ExportProps {
	selectedMeters: number[];
	exportVals: { datasets: ExportDataSet[] };
}

export default function ExportComponent(props: ExportProps) {
	/**
	 * Called when Export button is clicked.
	 * Passes an object containing the selected meter data to a function for export.
	 */
	const exportReading = () => {
		const compressedData = props.exportVals.datasets;
		const chart = compressedData[0].currentChart;
		const startTime = moment(compressedData[0].exportVals[0].x).format('ddddMMMDDYYYY');
		const name = `oedExport${startTime}${chart}.csv`;
		graphExport(compressedData,	name);
	};
	return (
		<div>
			<Button bsStyle='default' onClick={exportReading}>Export graph data</Button>
		</div>
	);
}
