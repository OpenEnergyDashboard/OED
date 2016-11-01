var mysql = require('mysql');
var parseXML = require('./parseXML');
var connPool = mysql.createPool({
	host: 'localhost',
	port: 32769,
	user: 'root', //username and password to mysql server running in Docker, not to anything real.
	password: 'guest',
	database: 'meter_data'
});
function insertMeters() {
	parseXML.parseXML(function (meter) {
		console.log(meter['name']);
		console.log(meter['ip']);
		connPool.getConnection(function (err, conn) {
			if (err) {
				console.log("error on get connection: " + err);
			}
			else {
				conn.query('INSERT INTO meters (name, ipAddress) VALUES (?, ?);', [meter['name'], meter['ip']], function (err) {
					conn.release();
					if (err) console.log(err);
				});
			}
		});

	});

}
//TODO: figure out how to end while still adding all meters
insertMeters();
//with this statement not all meters are added to the database
//without this statement the program will not terminate
// connPool.end(function (err) {
// 	console.log(err);
// });
