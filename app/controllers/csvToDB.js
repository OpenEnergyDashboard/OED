let pool = require('./../../models/pgPool').pool;
let parseCSV = require('./parseCSV');
let moment = require('moment');

// gets all the meters in the db
function getMeters(callback) {
	pool.connect((err, client, done) => {
		if (err) return console.error("error on get connection: " + err);
		client.query('SELECT * FROM meters', (err, result) => {
			done(); //release connection back to the pool
			if (err) return console.error("error querying for meters " + err);
			result = result.rows; //array of json objects
			callback(result);
		});
	});
}
//todo: form correct url based on a desired data resolution
// gets data from all meters and insert into db.
function getData() {
	getMeters((meters) => {
		for (let i in meters) {
			let meter = meters[i];
			//var url = 'http://' + meter['ipaddress'] + '/int4.csv'; // gets weekly data
			let url = 'http://' + meter['ipaddress'] + '/int2.csv'; //gets hourly data
			parseCSV.parseMeterCSV(url, meter['id'], (readings, id) => {
				//console.log(readings);
				for (let j in readings) {
					parseTimestamp(readings[j][1], (timestamp) => {
						let data = {meter_id: id, reading: readings[j][0], timestamp: timestamp};
						upsertReading(data, (result) => {
							//console.log(result);
						});
					});
				}
			});
		}
	});
}

// Inserts a reading to the db. fails on conflict
//I can't think of a reason to use this over upsertReading()
function insertReading(data, callback) {
	pool.connect((err, client, done) => {
		if (err) return console.error("error on get connection " + err);
		client.query('INSERT INTO readings (meter_id, reading, read_timestamp) VALUES ($1, $2, $3);',
			[data['meter_id'], data['reading'], data['timestamp']], function (err, result) {
				done();
				if (err) console.error("error inserting readings " + err);
				callback(result);
			});
	});
}

// Attempts to insert a reading and on conflict updates the existing reading
// data format: { meter_id: <value>, reading: <value>, timestamp: < YYYY-MM-DD HH:mm:ss > } with time in 24 hr format.
function upsertReading(data, callback) {
	pool.connect(function (err, client, done) {
		if (err) return console.error("error on get connection " + err);
		client.query('INSERT INTO readings (meter_id, reading, read_timestamp) VALUES ($1, $2, $3) ON CONFLICT (meter_id, read_timestamp) DO UPDATE SET reading = EXCLUDED.reading;', [data['meter_id'], data['reading'], data['timestamp']], function (err, result) {
			done();
			if (err) console.error("error inserting readings " + err);
			callback(result);
		});
	});
}

//takes in a single reading and returns the properly formed timestamp
function parseTimestamp(raw, callback) {
	let stamp = moment(raw, 'HH:mm:ss MM/DD/YY');
	stamp = stamp.format('YYYY-MM-DD HH:mm:ss');
	callback(stamp);
}


//getData();
exports.upsertData = upsertReading;
exports.pollMeters = getData;