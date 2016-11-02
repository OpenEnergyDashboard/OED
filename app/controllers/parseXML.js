var http = require('http');
var parseString = require('xml2js').parseString;
var parseXLSX = require('./parseXLSX.js');
var url = "http://144.89.8.12/sm101.xml";
var val = '';
var ips = parseXLSX.parseXLSX('ips.xlsx');
function getXML (url, ip, callback) {
    var req = http.get(url, function (res) {
        // save the data
        var xml = '';
        res.on('data', function (chunk) {
            xml += chunk;
        });
        res.on('end', function () {
            // parse xml
            parseString(xml, function (err, result) {
                val = result['Maverick']['NodeID'][0];
				val = {name: val, ip: ip};
                callback(val);
            })
        });
    });

	req.on('error', function (err) {
		console.error(err);
	});
}

function parseAll(callback) {
    for(var k in ips){
		var ip = ips[k].ip;
		url = 'http://'+ip+'/sm101.xml';
        getXML(url, ip, function(meter){
			console.log(meter);
			callback(meter);
			
        });
    }
}
exports.parseXML = parseAll;
// parseAll();
