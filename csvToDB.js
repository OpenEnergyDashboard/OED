var mysql		= require('mysql');
// var info 		= require('./private/login.js');
var parseCSV 	= require('./parseCSV.js');
var connection 	= mysql.createConnection({
    host     : 'localhost',
    port     : 32769,
    user     : 'root', //username and password to mysql server running in Docker, not to anything real.
    password : 'guest',
    database : 'meter_data'
});

parseCSV.parse(function(val){
	console.log(val);
});

connection.connect();

//TODO add appropriate json to right spot
//  for(var i = 0; i < values.length; i++){
//      var post  = values[i];
//      var query = connection.query('INSERT INTO meters SET ?', post, function(err, result) {
//          // Finish
//      });
//  }

//shows I can connect to the db. 
connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
    if (err) throw err;

    console.log('The solution is: ', rows[0].solution);
});

connection.end();
