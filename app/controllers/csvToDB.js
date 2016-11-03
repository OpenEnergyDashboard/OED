var pg = require('pg');
var parseCSV = require('./parseCSV');
var moment = require('moment');

var config = {
	user: 'capstone',
	database: 'capstone',
	password: 'guest', // server running in docker
	host: 'localhost',
	port: 5432,
	max: 10,
	idleTimeoutMillis: 30000
};

var pool = new pg.Pool(config);


function getMeters(callback) {
	pool.connect(function (err, client, done) {
		if (err) return console.error("error on get connection: " + err);

		client.query('SELECT * FROM meters', function (err, result) {
			done(); //release connection back to the pool
			if (err) return console.error("error inserting meters " + err);
			result = result.rows; //array of json objects
			callback(result);
			//console.log(result);
		});

	});
}

function getData() {
	getMeters(function (meters) {
		for (var i in meters) {
			var meter = meters[i];
			// console.log(meter);
			var url = 'http://' + meter['ipaddress'] + '/int2.csv';
			parseCSV.parseMeterCSV(url, meter['id'], function (readings, id) {
				//console.log(readings);
				for (var j in readings) {
					var timestamp = parseTimestamp(readings[j][1], function (timestamp) {
						var data = {meter_id: id, reading: readings[j][0], timestamp: timestamp};
						upsertReading(data, function (result) {
							//console.log(result);
						});
					});
				}
			});
		}
	});
}

function insertReading(data, callback) {
	pool.connect(function (err, client, done) {
		if (err) return console.error("error on get connection " + err);
		client.query('INSERT INTO readings (meter_id, reading, read_timestamp) VALUES ($1, $2, $3);',
			[data['meter_id'], data['reading'], data['timestamp']], function (err, result) {
				done();
				if (err) console.error("error inserting readings " + err);
				callback(result);
			});
	});
}

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

function parseTimestamp(raw, callback) {
	var stamp = moment(raw, 'HH:mm:ss MM/DD/YY');
	stamp = stamp.format('YYYY-MM-DD HH:mm:ss');
	callback(stamp);
}


//catches error from idle host
pool.on('error', function (err, client) {
	console.error('idle client error', err.message, err.stack)
});
//getData();
exports.upsertData = upsertReading;
exports.pollMeters = getData;