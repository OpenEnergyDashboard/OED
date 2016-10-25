var http = require('http');
var parseString = require('xml2js').parseString;
var url = "http://144.89.8.12/sm101.xml";
var val = '';
function getXML(url, callback) {
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
				callback(val);
			})
		});
	});

	req.on('error', function (err) {
		// debug error
	});
}

function parseAll(callback) {

	for (var i = 10; i <= 22; i++) {
		url = 'http://144.89.8.' + i + '/sm101.xml';
		console.log(url); // the ip adress is correct here
		var ip = url.match(/^.*?(\d+\.\d+\.\d+\.\d+).*/)[1]; //and this generates the correct address
		// TODO: make this get the correct ips
		getXML(url, function () {
			console.log('ip in parse: ' + ip ); //ips are incorrect here ( all 144.89.8.22 or the last address used)
			var meter = {'name': val, 'ip': ip};
			callback(meter);
		});
	}

}
exports.parseXML = parseAll;
//parseAll();
