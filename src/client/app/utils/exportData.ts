/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ExportDataSet, RawReadings } from '../types/readings';
import * as moment from 'moment';

/**
 * Function to converts the meter readings into a CSV formatted string.
 *
 * @param {ExportDataSet} item The meter reading.
 * @returns {string} output A string containing the CSV formatted meter readings.
 */
function convertToCSV(item: ExportDataSet) {
	let csvOutput = `Readings,Start Timestamp, End Timestamp, Meter name, ${item.label}, Unit, ${item.unit}\n`;
	const data = item.exportVals;
	data.forEach(reading => {
		const info = reading.y;
		// Why UTC is needed here has not been carefully analyzed.
		const startTimeStamp = moment.utc(reading.x).format('dddd LL LTS').replace(/,/g, ''); // use regex to omit pesky commas
		const endTimeStamp = moment.utc(reading.z).format('dddd LL LTS').replace(/,/g, '');
		csvOutput += `${info},${startTimeStamp},${endTimeStamp}\n`;
	});
	return csvOutput;
}

/**
 * Function to download the formatted CSV file to the users computer.
 *
 * @param {string} inputCSV A String containing the formatted CSV data.
 * @param {string} fileName A string representing the name of the file.
 */
function downloadCSV(inputCSV: string, fileName: string) {
	const element = document.createElement('a');
	element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(inputCSV)}`);
	element.setAttribute('download', fileName);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

/**
 * Function to export readings from the graph currently displaying. May be used for routing if more export options are added
 *
 * @param {ExportDataSet} dataSets An Object. The readings from each meter currently selected in the graph.
 * @param {string} name the name of the file.
 */
export default function graphExport(dataSets: ExportDataSet, name: string) {
	const dataToExport = convertToCSV(dataSets);
	downloadCSV(dataToExport, name);
}

/**
 * Function to export raw data that we request on button click
 *
 * @param {RawReadings[]} items list of readings directly from the database
 * @param {string} unit the unit identifier for data being exported
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export function downloadRawCSV(items: RawReadings[], unit: string) {
	let csvOutput = `Readings, Start Timestamp, End Timestamp, Meter, ${items[0].label}, Unit, ${unit} \n`;
	items.forEach(ele => {
		//.utc is not needed because this uses a different route than the way line graphs work. It returns a string that represents the
		// start/endTimestamp.
		// TODO The new line readings route for graphs allows one to get the raw data. We should try to switch to that and then modify
		// this code to use the unix timestamp that is returned. It is believed that the unix timestamp will be smaller than this string.
		// TODO This is causing a deprecated format warning. I believe it is because it is in the format "Tuesday June 1 2021 12:00:00 AM".
		// If we switch to the new route, we should remove this warning if we do the formatting here.
		const startTimestamp = moment(ele.startTimestamp).format('dddd LL LTS').replace(/,/g, ''); // use regex to omit pesky commas
		const endTimestamp = moment(ele.endTimestamp).format('dddd LL LTS').replace(/,/g, ''); // use regex to omit pesky commas
		csvOutput += `${ele.reading},${startTimestamp},${endTimestamp}\n`;
	})
	// Use regex to remove commas and replace spaces/colons/hyphens with underscores
	const startTime = moment(items[0].startTimestamp).format('LL_LTS').replace(/,/g, '').replace(/[\s:-]/g, '_');
	const endTime = moment(items[items.length - 1].startTimestamp).format('LL_LTS').replace(/,/g, '').replace(/[\s:-]/g, '_');
	const headingLabel = items[0].label;
	const filename = `oedRawExport_line_${startTime}_to_${endTime}_for_${headingLabel}.csv`;
	downloadCSV(csvOutput, filename);
}
/* eslint-enable @typescript-eslint/no-unused-vars */
