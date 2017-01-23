const XLSX = require('xlsx');

function parseXLSX(filename) {
	const workbook = XLSX.readFile(filename);
	// This isn't a property so we don't want dot-notation
	const worksheet = workbook.Sheets['Sheet1']; // eslint-disable-line dot-notation
	return XLSX.utils.sheet_to_json(worksheet);
}
exports.parseXLSX = parseXLSX;

