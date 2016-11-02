XLSX = require('xlsx');
function parseXLSX (filename) {
    var workbook = XLSX.readFile(filename);
    var worksheet = workbook.Sheets['Sheet1'];
    var result = XLSX.utils.sheet_to_json(worksheet);
    return result;
}
exports.parseXLSX = parseXLSX;

