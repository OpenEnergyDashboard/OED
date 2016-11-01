var http = require('http');
var parseString = require('xml2js').parseString;
var parseXLSX = require('./parseXLSX.js');
var url = "http://144.89.8.12/sm101.xml";
var val = '';
var ips = parseXLSX.parseXLSX('ips.xlsx');
function getXML (url,callback) {
    var req = http.get(url, function (res) {
        // save the data
        var xml = '';
        res.on('data', function (chunk) {
            xml += chunk;
        });
        res.on('end', function () {
            // parse xml
            parseString(xml, function (err, result) {
                val+=result;
                callback(val);
            })
        });
    });

    req.on('error', function (err) {
        // debug error
    });
};

function parseAll(callback) {
    for(ip in ips){
        url = 'http://'+ips[ip].ip+'/sm101.xml';
        getXML(url,function(){
            console.log(val);
        });
    }
}
exports.parseXML = parseAll;
parseAll();
