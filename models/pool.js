var mysql = require('mysql');

var pool  = mysql.createPool({
    host     : 'localhost',
    user     : 'root',
    password : 'guest',
    port     : 32769,
    database : 'meter_data'
});

exports.pool = pool;