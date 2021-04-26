/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ExportDataSet, RawReadings } from '../types/readings';
import { hasToken } from './token';
import { usersApi } from '../utils/api'
import * as moment from 'moment-timezone';
import { UserRole } from '../types/items';

/**
 * Function to converts the compressed meter data into a CSV formatted string.
 * @param items The compressed meter data.
 * @returns output A string containing the CSV formatted compressed meter data.
 */

function convertToCSV(items: ExportDataSet[]) {
	let csvOutput = 'Label,Readings,Start Timestamp\n';
	items.forEach(set => {
		const data = set.exportVals;
		const label = set.label;
		data.forEach(reading => {
			const info = reading.y;
			const startTimeStamp = moment(reading.x).utc().format('dddd LL LTS').replace(/,/g,''); // use regex to omit pesky commas
			csvOutput += `"${label}",${info},${startTimeStamp}\n`; // TODO: add column for units
		});
	});
	return csvOutput;
}
/**
 * Function to download the formatted CSV file to the users computer.
 * @param inputCSV A String containing the formatted CSV data.
 * @param fileName A string representing the name of the file.
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
 * Function to export compressed data from the graph currently displaying. May be used for routing if more export options are added
 * @param dataSets An Object. The compressed data from each meter currently selected in the graph.
 * @param name the name of the file.
 */
export default function graphExport(dataSets: ExportDataSet[], name: string) {
	const dataToExport = convertToCSV(dataSets);
	downloadCSV(dataToExport, name);
}

/**
 * Function to export raw data that we request on button click
 * @param items list of readings directly from the database
 * @param defaultLanguage the preferred localization to use for date/time formatting
 */
export function downloadRawCSV(items: RawReadings[], defaultLanguage: string) {
	// note that utc() is not needed
	let csvOutput = 'Label,Readings,Start Timestamp\n';
	items.forEach(ele => {
		const timestamp = moment(ele.startTimestamp).format('dddd LL LTS').replace(/,/g,''); // use regex to omit pesky commas
		csvOutput += `"${ele.label}",${ele.reading},${timestamp}\n`; // TODO: add column for units
	})
	// Use regex to remove commas and replace spaces/colons/hyphens with underscores
	const startTime = moment(items[0].startTimestamp).format('LL_LTS').replace(/,/g,'').replace(/[\s:-]/g,'_');
	const endTime = moment(items[items.length-1].startTimestamp).format('LL_LTS').replace(/,/g,'').replace(/[\s:-]/g,'_');
	const filename = `oedRawExport_line_${startTime}_to_${endTime}.csv`;
	downloadCSV(csvOutput, filename);
}

/**
 * Function that adds a div to handle exporting raw data
 * @param count number of lines in the file
 * @param done async function that does another request to get all data then download it
 */
// NOTE: This function is made with the idea that it will not be called very often
// Ideally we would have a component that prompts the user and handles all the logic
export async function graphRawExport(count: number, done: () => Promise<void>): Promise<any> {
	const fileSize = (count * 0.0442 / 1000)
	// 5 MB will download for anyone.
	// TODO Make this admin controllable
	if (fileSize <= 5) {
		return done();
	}

	const mainContainer = document.createElement('div');
	const innerContainer = document.createElement('div');
	mainContainer.appendChild(innerContainer);
	mainContainer.classList.add('fixed-top');
	mainContainer.style.width = '100vw';
	mainContainer.style.height = '100vh';
	mainContainer.style.display = 'flex';
	mainContainer.style.background = 'rgba(107,107,107,0.4)';
	mainContainer.style.justifyContent = 'center';
	mainContainer.style.alignItems = 'center';

	innerContainer.style.padding = '20px 10px';
	innerContainer.style.backgroundColor = 'white';
	innerContainer.style.border = '2px solid black';
	innerContainer.style.borderRadius = '10px';
	innerContainer.style.textAlign = 'center';

	innerContainer.innerHTML = `
		<p>File size will be about ${fileSize.toFixed(2)}MB.</p>
		<p>Are you sure you want to download</p>
	`;

	// 25 MB is limit for an admin without checking they really want to download,
	// TODO: Should this be under admin control?
	if (fileSize > 25 && (!hasToken() || !(await usersApi.hasRolePermissions(UserRole.EXPORT)))) { // 25 is hard coded but we should get it from state
		innerContainer.innerHTML = "<p>Sorry you don't have permissions to download due to large number of points.</p>";
		const okButton = document.createElement('button');
		okButton.innerHTML = 'ok';
		okButton.addEventListener('click', () => {
			document.body.removeChild(mainContainer);
		})
		innerContainer.appendChild(okButton);
		return document.body.appendChild(mainContainer);
	}

	const noButton = document.createElement('button');
	noButton.innerHTML = 'No';
	const yesButton = document.createElement('button');
	yesButton.innerHTML = 'Yes';

	innerContainer.appendChild(yesButton);
	innerContainer.appendChild(noButton);

	noButton.addEventListener('click', () => {
		document.body.removeChild(mainContainer);
	})

	yesButton.addEventListener('click', () => {
		document.body.removeChild(mainContainer);
		done();
	})

	document.body.appendChild(mainContainer);
}