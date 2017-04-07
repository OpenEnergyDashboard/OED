import moment from 'moment';

/**
 * A function that converts the compressed meter data into a CSV formatted string.
 * @param items The compressed meter data.
 * @returns output A string containing the CSV formatted compressed meter data.
 */

function convertToCSV(items) {
	let csvOutput = 'id:,readings:,timestamp:\n';
	items.forEach(set => {
		const data = set.exportVals;
		const id = set.id;
		let isStart = true;
		data.forEach(reading => {
			const info = reading.y;
			const timeStamp = moment(reading.x).format('dddd MMM DD YYYY hh:mm a');
			if (isStart) {
				csvOutput += `${id},${info} kwh, ${timeStamp} \n`;
				isStart = false;
			} else {
				csvOutput += `${id},${info} kwh, ${timeStamp} \n`;
			}
		});
	});
	return csvOutput;
}
/**
 * A function to download the formatted CSV file to the users computer.
 * @param inputCSV A String containing the formatted CSV data.
 */
function downloadCSV(inputCSV) {
	const csvContent = `data:text/csv;charset=utf-8,${inputCSV}`;
	const encodedUri = encodeURI(csvContent);
	const link = document.createElement('a');
	let fileName = window.prompt('Input a file name;', 'csvData');
	fileName += '.csv';
	link.setAttribute('href', encodedUri);
	link.setAttribute('download', fileName);
	document.body.appendChild(link);

	link.click(); // This will download the data file
}
/**
 * Function to export compressed data from the graph currently displaying. May be used for routing if more export options are added
 * @param dataSets An Object. The compressed data from each meter currently selected in the graph.
 */
export default function graphExport(dataSets) {
	const dataToExport = convertToCSV(dataSets);
	downloadCSV(dataToExport);
}
