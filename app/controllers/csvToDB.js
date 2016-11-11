let pg = require('pg');
let parseXML = require('./parseXML');
let parseCSV = require('./parseCSV');
let moment = require('moment');

let config = {
	user: 'capstone',
	database: 'capstone',
	password: 'guest', // server running in docker
	host: 'localhost',
	port: 5432,
	max: 10,
	idleTimeoutMillis: 30000
};

let pool = new pg.Pool(config);


function getMeters(callback) {
	pool.connect((err, client, done) => {
		if (err) return console.error("error on get connection: " + err);
		client.query('SELECT * FROM meters', (err, result) => {
			done(); //release connection back to the pool
			if (err) return console.error("error inserting meters " + err);
			result = result.rows; //array of json objects
			callback(result);
		});
	});
}

function getData() {
	getMeters((meters) => {
		for (let i in meters) {
			let meter = meters[i];
			let url = 'http://' + meter['ipaddress'] + '/int4.csv';
			parseCSV.parseMeterCSV(url, meter['id'], (readings, id) => {
				//console.log(readings);
				for (let j in readings) {
					let timestamp = parseTimestamp(readings[j][1], (timestamp) => {
						let data = {meter_id: id, reading: readings[j][0], timestamp: timestamp};
						insertReading(data, (result) =>{
							//console.log(result);
						});
					});
				}
			});
		}
	});
}

function insertReading(data, callback){
	pool.connect((err, client, done) => {
		if (err) return console.error("error on get connection " + err);
		client.query('INSERT INTO readings (meter_id, reading, read_timestamp) VALUES ($1, $2, $3);',
			[data['meter_id'], data['reading'], data['timestamp']], (err, result) => {
				done();
				if (err) console.error("error inserting readings " + err);
				callback(result);
			});
	});
}

function parseTimestamp(raw, callback) {
	let stamp = moment(raw, 'HH:mm:ss MM/DD/YY');
	stamp = stamp.format('YYYY-MM-DD HH:mm:ss');
	callback(stamp);
}


//catches error from idle host
pool.on('error', (err, client) => {
	console.error('idle client error', err.message, err.stack)
});
getData();
