let pg = require('pg');
let parseXML = require('./parseXML');

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


function insertMeters() {
	// TODO: decouple this from parse xml so that it will work with whatever json we give it
	parseXML.parseXML((meter) => {
		pool.connect((err, client, done) => {
			if (err) {
				return console.error("error on get connection: " + err);
			}
			client.query('INSERT INTO meters (name, ipAddress) VALUES ($1, $2);', [meter['name'], meter['ip']], (err, result) => {
				done(); //release connection back to the pool
				if (err) return console.error("error inserting meters " + err);
				//console.log(result.rows[0].number+"x");
			});
		});
	});
}
//catches error from idle host
pool.on('error', (err, client) => {
	console.error('idle client error', err.message, err.stack)
});
insertMeters();
