/**
 * Created by lucas on 9/25/2016.
 */

var http = require('http');
var parseString = require('xml2js').parseString;
var url = "http://144.89.8.12/sm101.xml";
function parseXML (url) {
    var req = http.get(url, function (res) {
        // save the data
        var xml = '';
        res.on('data', function (chunk) {
            xml += chunk;
        });
        res.on('end', function () {
            // parse xml
            parseString(xml, function (err, result) {
                console.log(result);
            })
        });
    });

    req.on('error', function (err) {
        // debug error
    });
};

for(var i = 10;i<=22;i++){
    url = 'http://144.89.8.'+i+'/sm101.xml';
    parseXML(url);
}