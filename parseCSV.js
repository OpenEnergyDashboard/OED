var http = require('http');
var CSV = require('csv');
var url = "http://144.89.8.12/sm101.xml";
var val ='';
    function getCSV(url,callback) {
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
                    callback(val);
                })
            });
        });
        req.on('error', function (err) {
            // debug error
        });
    }

//currently returns minute csv file. Increment int<number>.csv to scale.
    function parseAll(callback) {
        for (var i = 10; i <= 22; i++) {
            url = 'http://144.89.8.' + i + '/int4.csv';
            getCSV(url,function () {
                //freed val from callback hell
                console.log(val);
            });
        }
    }
exports.parse =parseAll;
parseAll();