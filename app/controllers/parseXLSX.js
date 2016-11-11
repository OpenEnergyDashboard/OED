let XLSX = require('xlsx');
function parseXLSX (filename) {
    let workbook = XLSX.readFile(filename);
    let worksheet = workbook.Sheets['Sheet1'];
    return XLSX.utils.sheet_to_json(worksheet);
}
exports.parseXLSX = parseXLSX;

