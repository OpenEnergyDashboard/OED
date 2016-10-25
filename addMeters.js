var mysql = require('mysql');
var parseXML = require('./parseXML');
var connPool = mysql.createPool({
	host     : 'localhost',
	port     : 32769,
	user     : 'root', //username and password to mysql server running in Docker, not to anything real.
	password : 'guest',
	database : 'meter_data'
});
function insertMeters(){
	parseXML.parseXML(function(meter){
		console.log(meter['name']);
		console.log(meter['ip']);
		connPool.getConnection(function(error, conn){
			if (error){
				console.log("There is no cause for alarm.");
			}
			else{
				conn.query('INSERT INTO meters (name, ipAddress) VALUES (?, ?);', [meter['name'], meter['ip']]);
			}
		});

	});
}
insertMeters()