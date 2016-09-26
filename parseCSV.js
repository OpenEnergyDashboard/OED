/**
 * Created by lucas on 9/25/2016.
 */
/**
 * Created by lucas on 9/25/2016.
 */

var http = require('http');
var CSV = require('csv');
var url = "http://144.89.8.12/sm101.xml";
function parseCSV (url) {
    var req = http.get(url, function (res) {
        // save the data
        var csv = '';
        res.on('data', function (chunk) {
            csv += chunk;
        });
        res.on('end', function () {
            // parse csv
            CSV.parse(csv, function (err, result) {
                console.log(result);
            })
        });
    });

    req.on('error', function (err) {
        // debug error
    });
};
//currently returns minute csv file. Increment int<number>.csv to scale.
for(var i = 10;i<=22;i++){
    url = 'http://144.89.8.'+i+'/int1.csv';
    parseCSV(url);
}