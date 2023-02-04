/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button } from 'reactstrap';
import * as moment from 'moment';
import graphExport, { graphRawExport, downloadRawCSV } from '../utils/exportData';
import { ExportDataSet } from '../types/readings';
import { FormattedMessage } from 'react-intl';
import { metersApi } from '../utils/api'
import TooltipMarkerComponent from './TooltipMarkerComponent';
import { State } from '../types/redux/state';
import { useSelector } from 'react-redux';

interface ExportProps {
	exportVals: { datasets: ExportDataSet[] };
}

export default function ExportComponent(props: ExportProps) {
	/**
	 * Called when Export button is clicked.
	 * Passes an object containing the selected meter data to a function for export.
	 */
	// Meters state
	const metersState = useSelector((state: State) => state.meters.byMeterID);
	// Units state
	const unitsState = useSelector((state: State) => state.units.units);
	// graph state
	const graphState = useSelector((state: State) => state.graph);
	// admin state
	const adminState = useSelector((state: State) => state.admin);

	// Function to export the data in a graph.
	const exportGraphReading = () => {
		// Look over each graphic item and export one at a time into its own file.
		for (let i = 0; i < props.exportVals.datasets.length; i++) {
			// Data for current graphic item to export
			const currentGraphItem = props.exportVals.datasets[i];
			// Sort the dataset based on the start time of each value in item
			currentGraphItem.exportVals.sort((a, b) => {
				if (a.x < b.x) {
					return -1;
				}
				return 1;
			})

			// Determine and format the first time in the dataset which is first one in array since just sorted and the start time.
			// These values are already UTC so they are okay. Why has not been tracked down.
			let startTime = moment(currentGraphItem.exportVals[0].x);
	
			// Determine and format the last time in the dataset which is the end time.
			let endTime = moment(currentGraphItem.exportVals[currentGraphItem.exportVals.length - 1].z);

			// Use regex to remove commas and replace spaces/colons/hyphens with underscores
			const startTimeString = startTime.utc().format('LL_LTS').replace(/,/g, '').replace(/[\s:-]/g, '_');
			const endTimeString = endTime.utc().format('LL_LTS').replace(/,/g, '').replace(/[\s:-]/g, '_');
			// This is line, bar
			const chartName = currentGraphItem.currentChart;
			// This is the meter identifier
			const meterName = currentGraphItem.label;
			// This is the graphic unit
			const unit = currentGraphItem.unit;
			// This is the file name with all the above info so unique
			const name = `oedExport_${chartName}_${startTimeString}_to_${endTimeString}_${meterName}_${unit}.csv`;
			graphExport(currentGraphItem, name);
		}
	};

	const exportRawReadings = async () => {
		if (graphState.selectedMeters.length === 0)
			return;
		const data: number[] = []
		for (let i = 0; i < graphState.selectedMeters.length; i++) {
			data.push(graphState.selectedMeters[i]);
			const meterID = metersState[graphState.selectedMeters[i]].unitId;
			const unitName = unitsState[meterID].identifier;

			const count = await metersApi.lineReadingsCount(graphState.selectedMeters, graphState.timeInterval);
			graphRawExport(count, adminState.defaultWarningFileSize, adminState.defaultFileSizeLimit, async () => {
				const lineReading = await metersApi.rawLineReadings(data, graphState.timeInterval);
				downloadRawCSV(lineReading, unitName);
			});
			data.splice(0, data.length);
		}
	}

	return (
		<>
			<div>
				<Button outline onClick={exportGraphReading}>
					<FormattedMessage id='export.graph.data' />
				</Button>
				<TooltipMarkerComponent page='home' helpTextId='help.home.export.graph.data' />
			</div>
			{/* Only raw export if a line graph */}
			{graphState.chartToRender === 'line' ? <div style={{ paddingTop: '10px' }}>
				<Button outline onClick={exportRawReadings}>
					<FormattedMessage id='export.raw.graph.data' />
				</Button>
			</div> : ''}
		</>
	);
}
