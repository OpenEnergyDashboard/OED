/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button } from 'reactstrap';
import * as moment from 'moment';
import graphExport, { graphRawExport, downloadRawCSV } from '../utils/exportData';
import { ExportDataSet } from '../types/readings';
import { FormattedMessage } from 'react-intl';
import { TimeInterval } from '../../../common/TimeInterval';
import { metersApi } from '../utils/api'
import TooltipMarkerComponent from './TooltipMarkerComponent';

interface ExportProps {
	showRawExport: boolean;
	selectedMeters: number[];
	exportVals: { datasets: ExportDataSet[] };
	timeInterval: TimeInterval;
	defaultLanguage: string;
}

export default function ExportComponent(props: ExportProps) {
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
		// Use regex to remove commas and replace spaces/colons/hyphens with underscores
		const startTimeString = startTime.utc().format('LL_LTS').replace(/,/g,'').replace(/[\s:-]/g,'_');
		const endTimeString = endTime.utc().format('LL_LTS').replace(/,/g,'').replace(/[\s:-]/g,'_');
		const chartName = compressedData[0].currentChart;
		const name = `oedExport_${chartName}_${startTimeString}_to_${endTimeString}.csv`;
		graphExport(compressedData, name);
	};

	const exportRawReadings = async () => {
		if (props.selectedMeters.length === 0)
			return;
		const count = await metersApi.lineReadingsCount(props.selectedMeters, props.timeInterval);
		graphRawExport(count, async () => {
			const lineReading = await metersApi.rawLineReadings(props.selectedMeters, props.timeInterval);
			downloadRawCSV(lineReading,props.defaultLanguage);
		});
	}

	return (
		<>
			<div>
				<Button outline onClick={exportReading}>
					<FormattedMessage id='export.graph.data' />
				</Button>
				<TooltipMarkerComponent page='home' helpTextId='help.home.export.graph.data' />
			</div>
			{props.showRawExport ? <div style={{ paddingTop: '10px' }}>
				<Button outline onClick={exportRawReadings}>
					<FormattedMessage id='export.raw.graph.data' />
				</Button>
			</div> : ''}
		</>
	);
}
