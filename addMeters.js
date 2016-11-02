var pg = require('pg');
var parseXML = require('./parseXML');

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


function insertMeters() {
	parseXML.parseXML(function (meter) {
		// console.log(meter);
		// console.log("one " + meter['name']);
		// console.log("one " + meter['ip']);
		pool.connect(function (err, client, done) {
			if (err) {
				return console.error("error on get connection: " + err);
			}
			client.query('INSERT INTO meters (name, ipAddress) VALUES ($1, $2);', [meter['name'], meter['ip']], function (err, result) {
				done(); //release connection back to the pool
				if (err) return console.error("error inserting meters " + err);
				//console.log(result.rows[0].number+"x");
			});

		});

	});

}
//catches error from idle host
pool.on('error', function (err, client) {
	console.error('idle client error', err.message, err.stack)
});
insertMeters();

