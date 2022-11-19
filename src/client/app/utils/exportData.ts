/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ExportDataSet, RawReadings } from '../types/readings';
import { hasToken } from './token';
import { usersApi } from '../utils/api'
import * as moment from 'moment';
import { UserRole } from '../types/items';
import translate from './translate';

/**
 * Function to converts the meter readings into a CSV formatted string.
 * @param items The meter reading.
 * @returns output A string containing the CSV formatted meter readings.
 */

function convertToCSV(items: ExportDataSet[]) {
	let csvOutput = 'Readings,Start Timestamp,End Timestamp,Label,Unit,Utility\n';
	items.forEach(set => {
		const data = set.exportVals;
		const label = set.label;
		const unit = set.unit;
		let firstLine = true;
		data.forEach(reading => {
			const info = reading.y;
			// Why UTC is needed here has not been carefully analyzed.
			const startTimeStamp = moment.utc(reading.x).format('dddd LL LTS').replace(/,/g, ''); // use regex to omit pesky commas
			const endTimeStamp = moment.utc(reading.z).format('dddd LL LTS').replace(/,/g, '');
			if (firstLine) {
				firstLine = false;
				csvOutput += `${info},${startTimeStamp},${endTimeStamp}`;
				csvOutput += `"${label}",${unit}\n`;//null at the moment
			}
			else {
				csvOutput += `${info},${startTimeStamp},${endTimeStamp}\n`;
			}
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
 * Function to export readings from the graph currently displaying. May be used for routing if more export options are added
 * @param dataSets An Object. The readings from each meter currently selected in the graph.
 * @param name the name of the file.
 */
//call this fcn in a loop
export default function graphExport(dataSets: ExportDataSet[], name: string) {
	const dataToExport = convertToCSV(dataSets);
	downloadCSV(dataToExport, name);
}

/**
 * Function to export raw data that we request on button click
 * @param items list of readings directly from the database
 * @param defaultLanguage the preferred localization to use for date/time formatting
 */
// below comment should be removed when we either remove defaultLanguage or implement it into the following function
/* eslint-disable @typescript-eslint/no-unused-vars */
export function downloadRawCSV(items: RawReadings[], defaultLanguage: string) {
	let csvOutput = 'Label,Readings,Start Timestamp,End Timestamp,\n';
	items.forEach(ele => {
		//.utc is not needed because this uses a different route than the way line graphs work. It returns a string that represents the
		// start/endTimestamp.
		// TODO The new line readings route for graphs allows one to get the raw data. We should try to switch to that and then modify
		// this code to use the unix timestamp that is returned. It is believed that the unix timestamp will be smaller than this string.
		// TODO This is causing a deprecated format warning. I believe it is because it is in the format "Tuesday June 1 2021 12:00:00 AM".
		// If we switch to the new route, we should remove this warning if we do the formatting here.
		const startTimestamp = moment(ele.startTimestamp).format('dddd LL LTS').replace(/,/g, ''); // use regex to omit pesky commas
		const endTimestamp = moment(ele.endTimestamp).format('dddd LL LTS').replace(/,/g, ''); // use regex to omit pesky commas
		csvOutput += `"${ele.label}",${ele.reading},${startTimestamp},${endTimestamp}\n`; // TODO: add column for units
	})
	// Use regex to remove commas and replace spaces/colons/hyphens with underscores
	const startTime = moment(items[0].startTimestamp).format('LL_LTS').replace(/,/g, '').replace(/[\s:-]/g, '_');
	const endTime = moment(items[items.length - 1].startTimestamp).format('LL_LTS').replace(/,/g, '').replace(/[\s:-]/g, '_');
	const filename = `oedRawExport_line_${startTime}_to_${endTime}.csv`;
	downloadCSV(csvOutput, filename);
}
/* eslint-enable @typescript-eslint/no-unused-vars */
// as well as above comment

/**
 * Function that adds a div to handle exporting raw data
 * @param count number of lines in the file
 * @param done async function that does another request to get all data then download it
 */
// NOTE: This function is made with the idea that it will not be called very often
// Ideally we would have a component that prompts the user and handles all the logic
export async function graphRawExport(count: number, warningFileSize: number, fileSizeLimit: number, done: () => Promise<void>): Promise<any> {
	const fileSize = (count * 0.0849 / 1000);
	// Download for anyone without warning
	if (fileSize <= warningFileSize) {
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

	innerContainer.innerHTML =
		'<p>' + translate('csv.download.size.warning.size') + ` ${fileSize.toFixed(2)}MB.</p>
		<p>` + translate('csv.download.size.warning.verify') + '</p>'
	;

	// fileSizeLimit is limit for an admin without checking they really want to download,
	if (fileSize > fileSizeLimit && (!hasToken() || !(await usersApi.hasRolePermissions(UserRole.EXPORT)))) {
		innerContainer.innerHTML = '<p>' + translate('csv.download.size.limit') + '</p>';
		const okButton = document.createElement('button');
		okButton.innerHTML = 'ok';
		okButton.addEventListener('click', () => {
			document.body.removeChild(mainContainer);
		})
		innerContainer.appendChild(okButton);
		return document.body.appendChild(mainContainer);
	}

	const noButton = document.createElement('button');
	noButton.innerHTML = translate('no');
	const yesButton = document.createElement('button');
	yesButton.innerHTML = translate('yes');

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