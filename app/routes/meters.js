var express = require('express');
var pool = require('./../../models/pool.js').pool;
var router = express.Router();

/* GET all meters */
router.get('/', function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.json({"code": 100, "status": "Error in connection database"});
            return;
        }
        connection.query("SELECT * FROM Meters", function (err, rows) {
            connection.release();
            if (!err) {
                res.json(rows);
            }
            else {
                console.log('Error while performing GET all meters query');
            }
        });
        connection.on('error', function (err) {
            res.json({"code": 100, "status": "Error in connection to database"});
        });
    });
});

/* GET a specific user by id */
router.get('/:meter_id', function (req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.json({"code": 100, "status": "Error in connection database"});
            return;
        }
        connection.query("SELECT * FROM Meters WHERE meter_id = ?", req.params.meter_id, function (err, user) {
            connection.release();
            if (!err) {
                res.json(user);
            }
            else {
                console.log('Error while performing GET specific meter by id query');
            }
        });
        connection.on('error', function (err) {
            res.json({"code": 100, "status": "Error in connection to database"});
        });
    });
});

module.exports = router;