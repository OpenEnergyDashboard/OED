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
	defaultWarningFileSize: number;
	defaultFileSizeLimit: number;
}

export default function ExportComponent(props: ExportProps) {
	/**
	 * Called when Export button is clicked.
	 * Passes an object containing the selected meter data to a function for export.
	 */
	const exportReading = () => {
		const data = props.exportVals.datasets;

		// Sort the dataset based on the start time
		data.forEach(reading => {
			if (reading !== undefined) {
				reading.exportVals.sort((a, b) => {
					if (a.x < b.x) {
						return -1;
					}
					return 1;
				})
			}
		})

		//separate the data by meter and call export fcn in a loop
		//----------------------------------------------------------

		// Determine and format the first time in the dataset
		// These values are already UTC so they are okay. Why has not been tracked down.
		let startTime = moment(data[0].exportVals[0].x);
		for (const reading of data) {
			if (reading !== undefined) {
				const startTimeOfDataset = moment(reading.exportVals[0].x);
				if (startTime.isAfter(startTimeOfDataset)) {
					startTime = startTimeOfDataset;
				}
			}
		}

		// Determine and format the last time in the dataset
		let endTime = moment(data[0].exportVals[data[0].exportVals.length - 1].x);
		for (const reading of data) {
			if (reading !== undefined) {
				const endTimeOfDataset = moment(reading.exportVals[reading.exportVals.length - 1].x);
				if (endTimeOfDataset.isAfter(endTime)) {
					endTime = endTimeOfDataset;
				}
			}
		}
		// Use regex to remove commas and replace spaces/colons/hyphens with underscores
		const startTimeString = startTime.utc().format('LL_LTS').replace(/,/g, '').replace(/[\s:-]/g, '_');
		const endTimeString = endTime.utc().format('LL_LTS').replace(/,/g, '').replace(/[\s:-]/g, '_');
		const chartName = data[0].currentChart;
		const meterName = data[0].label;
		const unit = data[0].unit;
		const name = `oedExport_${chartName}_${meterName}_${unit}_${startTimeString}_to_${endTimeString}.csv`;
		graphExport(data, name);
	};

	const exportRawReadings = async () => {
		if (props.selectedMeters.length === 0)
			return;
		const count = await metersApi.lineReadingsCount(props.selectedMeters, props.timeInterval);
		graphRawExport(count, props.defaultWarningFileSize, props.defaultFileSizeLimit, async () => {
			const lineReading = await metersApi.rawLineReadings(props.selectedMeters, props.timeInterval);
			downloadRawCSV(lineReading, props.defaultLanguage);
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
