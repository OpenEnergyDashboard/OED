let http = require('http');
let parseString = require('xml2js').parseString;
let parseXLSX = require('./parseXLSX.js');
let url = "http://144.89.8.12/sm101.xml";
let val = '';
let ips = parseXLSX.parseXLSX('ips.xlsx');
function getXML (url, ip, callback) {
    let req = http.get(url, res => {
        // save the data
        let xml = '';
        res.on('data', chunk => {
            xml += chunk;
        });
        res.on('end', () => {
            // parse xml
            parseString(xml, (err, result) => {
                val = result['Maverick']['NodeID'][0];
				val = {name: val, ip: ip};
                callback(val);
            })
        });
    });

	req.on('error', err => {
		console.error(err);
	});
}

function parseAll(callback) {
    for(let k in ips){
		let ip = ips[k].ip;
		url = 'http://'+ip+'/sm101.xml';
        getXML(url, ip, meter => {
			console.log(meter);
			callback(meter);
        });
    }
}
exports.parseXML = parseAll;
// parseAll();
