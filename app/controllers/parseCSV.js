let http = require('http');
let CSV = require('csv');
let parseXLSX = require('./parseXLSX.js');
let url = "http://144.89.8.12/sm101.xml";
let val ='';
let ips = parseXLSX.parseXLSX('ips.xlsx');

function getCSV(url, meter_id, callback) {
    var req = http.get(url, (res) => {
        // save the data
        let csv = '';
        res.on('data', (chunk) => {
            csv += chunk;
        });
        res.on('end', () => {
            // parse csv
            CSV.parse(csv, (err, result) => {
                val = result;
                callback(val, meter_id);
            });
        });
    });
    req.on('error', err => {
        // debug error
    });
}

//currently returns minute csv file. Increment int<number>.csv to scale.
function parseAll(callback) {
    for (let k in ips) {
        url = 'http://' + ips[k].ip + '/int4.csv';
        getCSV(url, () => {
            //freed val from callback hell
            console.log(val);
        });
    }
}
exports.parse =parseAll;
//parseAll();
exports.parseMeterCSV = getCSV;

//this syntax seems to work for calling functions from other files.
//console.log(parseXLSX.parseXLSX('ips.xlsx')[0].ip);