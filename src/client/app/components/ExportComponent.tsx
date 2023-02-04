/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button } from 'reactstrap';
import * as moment from 'moment';
import graphExport, { downloadRawCSV } from '../utils/exportData';
import { ExportDataSet } from '../types/readings';
import { FormattedMessage } from 'react-intl';
import { metersApi } from '../utils/api'
import TooltipMarkerComponent from './TooltipMarkerComponent';
import { State } from '../types/redux/state';
import { useSelector } from 'react-redux';
import { hasToken } from '../utils/token';
import { usersApi } from '../utils/api'
import { UserRole } from '../types/items';
import translate from '../utils/translate';

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
		// Loop over each graphic item and export one at a time into its own file.
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
			// TODO this is the same for all graph exports so fix this and value in datasets.
			const unit = currentGraphItem.unit;
			// This is the file name with all the above info so unique
			const name = `oedExport_${chartName}_${startTimeString}_to_${endTimeString}_${meterName}_${unit}.csv`;
			graphExport(currentGraphItem, name);
		}
	};

	// Function to export raw readings of graphic data shown.
	const exportRawReadings = async () => {
		// Get the total number of readings for all meters so can warn user if large.
		const count = await metersApi.lineReadingsCount(graphState.selectedMeters, graphState.timeInterval);
		// Estimated file size in MB
		const fileSize = (count * 0.0857 / 1000);
		// TODO const fileSize = 4;
		// Decides if the readings should be exported, true if should.
		let shouldDownload = false;
		if (fileSize <= adminState.defaultWarningFileSize) {
			// File sizes that anyone can download without prompting so fine
			shouldDownload = true;
		} else if (fileSize > adminState.defaultFileSizeLimit) {
			// Exceeds the size allowed unless admin or export role and must verify want to continue.
			if (hasToken() || await usersApi.hasRolePermissions(UserRole.EXPORT)) {
				// A user allowed to do this but need to check okay with them.
				const msg = translate('csv.download.size.warning.size') + ` ${fileSize.toFixed(2)}MB. ` +
					translate('csv.download.size.warning.verify') + '?';
				const consent = window.confirm(msg);
				if (consent) {
					shouldDownload = true;
				}
			} else {
				// User not allowed to download.
				const msg = translate('csv.download.size.warning.size') + ` ${fileSize.toFixed(2)}MB. ` +
					translate('csv.download.size.limit');
				window.alert(msg);
			}
		} else {
			// Anyone can download if they approve
			const msg = translate('csv.download.size.warning.size') + ` ${fileSize.toFixed(2)}MB. ` +
				translate('csv.download.size.warning.verify') + '?';
			const consent = window.confirm(msg);
			if (consent) {
				shouldDownload = true;
			}
		}

		if (shouldDownload) {
			// Loop over each selected meter in graphic. Does nothing if no meters selected.
			for (let i = 0; i < graphState.selectedMeters.length; i++) {
				// Which selected meter being processed.
				const currentMeter = graphState.selectedMeters[i];
				// The unit of the currentMeter.
				const meterID = metersState[currentMeter].unitId;
				// The identifier of currentMeter unit.
				// Note that each meter can have a different unit so look up for each one.
				const unitName = unitsState[meterID].identifier;

				// 	// TODO ???? Maybe use new data way instead.
				const lineReading = await metersApi.rawLineReadings(currentMeter, graphState.timeInterval);
				downloadRawCSV(lineReading, unitName);
			}
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
