/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import moment from 'moment';


/**
 * Function to converts the compressed meter data into a CSV formatted string.
 * @param items The compressed meter data.
 * @returns output A string containing the CSV formatted compressed meter data.
 */

function convertToCSV(items) {
	let csvOutput = 'Label,Readings,Start Timestamp\n';
	items.forEach(set => {
		const data = set.exportVals;
		const label = set.label;
		data.forEach(reading => {
			const info = reading.y;
			const startTimeStamp = moment(reading.x).format('dddd MMM DD YYYY hh:mm a');
			csvOutput += `"${label}",${info} kW, ${startTimeStamp}\n`; // this assumes that meter readings are in kW
		});
	});
	return csvOutput;
}
/**
 * Function to download the formatted CSV file to the users computer.
 * @param inputCSV A String containing the formatted CSV data.
 * @param fileName A string representing the name of the file.
 */
function downloadCSV(inputCSV, fileName) {
	const element = document.createElement('a');
	element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(inputCSV)}`);
	element.setAttribute('download', fileName);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

/**
 * Function to export compressed data from the graph currently displaying. May be used for routing if more export options are added
 * @param dataSets An Object. The compressed data from each meter currently selected in the graph.
 * @param name the name of the file.
 */
export default function graphExport(dataSets, name) {
	const dataToExport = convertToCSV(dataSets);
	downloadCSV(dataToExport, name);
}
