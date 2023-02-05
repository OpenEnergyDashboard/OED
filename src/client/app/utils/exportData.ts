/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LineReading, RawReadings } from '../types/readings';
import * as moment from 'moment';
import { ChartTypes } from 'types/redux/graph';

/**
 * Function to converts the meter readings into a CSV formatted string.
 *
 * @param {LineReading[]} readings The meter readings.
 * @param {string} meter the meter identifier for data being exported
 * @param {string} unitLabel the full y-axis label on the graphic
 * @returns {string} output A string containing the CSV formatted meter readings.
 */
function convertToCSV(readings: LineReading[], meter: string, unitLabel: string) {
	let csvOutput = `Readings,Start Timestamp, End Timestamp, Meter name, ${meter}, Unit, ${unitLabel}\n`;
	readings.forEach(reading => {
		const value = reading.reading;
		// Why UTC is needed here has not been carefully analyzed.
		const startTimeStamp = moment.utc(reading.startTimestamp).format('dddd LL LTS').replace(/,/g, ''); // use regex to omit pesky commas
		const endTimeStamp = moment.utc(reading.endTimestamp).format('dddd LL LTS').replace(/,/g, '');
		csvOutput += `${value},${startTimeStamp},${endTimeStamp}\n`;
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
 * @param {LineReading[]} readings The readings from the meter to export the graphic points.
 * @param {string} meter the meter identifier for data being exported
 * @param {string} unitLabel the full y-axis label on the graphic
 * @param {string} unitIdentifier the unit identifier for data being exported
 * @param {ChartTypes} chartName the name of the chart/graphic being exported
 */
export default function graphExport(readings: LineReading[], meter: string, unitLabel: string, unitIdentifier: string, chartName: ChartTypes) {
	const dataToExport = convertToCSV(readings, meter, unitLabel);

	// Determine and format the first time in the dataset which is first one in array since just sorted and the start time.
	// These values are already UTC so they are okay. Why has not been tracked down.
	const startTime = moment(readings[0].startTimestamp);
	// Determine and format the last time in the dataset which is the end time.
	const endTime = moment(readings[readings.length - 1].endTimestamp);
	// Use regex to remove commas and replace spaces/colons/hyphens with underscores in timestamps
	const startTimeString = startTime.utc().format('LL_LTS').replace(/,/g, '').replace(/[\s:-]/g, '_');
	const endTimeString = endTime.utc().format('LL_LTS').replace(/,/g, '').replace(/[\s:-]/g, '_');

	// This is the file name with all the above info so unique.
	// Note it only uses the unit identifier not with the rate because that has funny characters.
	const filename = `oedExport_${chartName}_${startTimeString}_to_${endTimeString}_${meter}_${unitIdentifier}.csv`;
	downloadCSV(dataToExport, filename);
}

/**
 * Function to export raw data that we request on button click
 *
 * @param {RawReadings[]} items list of readings directly from the database
 * @param {string} meter the meter identifier for data being exported
 * @param {string} unit the unit identifier for data being exported
 */
export function downloadRawCSV(items: RawReadings[], meter: string, unit: string) {
	let csvOutput = `Readings, Start Timestamp, End Timestamp, Meter, ${meter}, Unit, ${unit} \n`;
	items.forEach(ele => {
		// Use regex to omit pesky commas which are painful in a CSV file.
		// As elsewhere, preserve the UTC time that comes from the DB.
		const startTimestamp = moment.utc(ele.s).format('dddd LL LTS').replace(/,/g, '');
		const endTimestamp = moment.utc(ele.e).format('dddd LL LTS').replace(/,/g, '');
		csvOutput += `${ele.r},${startTimestamp},${endTimestamp}\n`;
	})
	// Use regex to remove commas and replace spaces/colons/hyphens with underscores.
	// These are time times for the file name which go from the first reading start time to the last reading end time.
	// Easy to get since the data is sorted.
	const startTime = moment.utc(items[0].s).format('LL_LTS').replace(/,/g, '').replace(/[\s:-]/g, '_');
	const endTime = moment.utc(items[items.length - 1].e).format('LL_LTS').replace(/,/g, '').replace(/[\s:-]/g, '_');
	const filename = `oedRawExport_line_${startTime}_to_${endTime}_for_${meter}.csv`;
	downloadCSV(csvOutput, filename);
}
