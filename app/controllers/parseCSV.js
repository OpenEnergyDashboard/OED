var http = require('http');
var CSV = require('csv');
var parseXLSX = require('./parseXLSX.js');
var url = "http://144.89.8.12/sm101.xml";
var val ='';
var ips = parseXLSX.parseXLSX('ips.xlsx');
    function getCSV(url, meter_id, callback) {
        var req = http.get(url, function (res) {
            // save the data
            var csv = '';
            res.on('data', function (chunk) {
                csv += chunk;
            });
            res.on('end', function () {
                // parse csv
                CSV.parse(csv, function (err, result) {
                    val = result;
                    callback(val, meter_id);
                })
            });
        });
        req.on('error', function (err) {
            // debug error
        });
    }

//currently returns minute csv file. Increment int<number>.csv to scale.
    function parseAll(callback) {
        for (k in ips) {
            url = 'http://' + ips[k].ip + '/int4.csv';
            getCSV(url,function () {
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