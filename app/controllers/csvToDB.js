var mysql      = require('mysql');
var info = require('./private/login.js');
var parseCSV = require('./parseCSV.js');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : info.usr,
    password : info.pswd,
    database : 'meter_data'
});

var values = parseCSV.parse();
console.log(values);
connection.connect();


//TODO add appropriate json to right spot
 for(var i = 0; i < values.length; i++){
     var post  = values[i]
     var query = connection.query('INSERT INTO meters SET ?', post, function(err, result) {
         // Finish
     });
 }

//shows I can connect to the db. 
connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
    if (err) throw err;

    console.log('The solution is: ', rows[0].solution);
});

connection.end();
