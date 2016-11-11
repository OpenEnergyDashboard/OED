let express = require('express');
let pool = require('./../../models/pool.js').pool;
let router = express.Router();

/* GET all meters */
router.get('/', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            connection.release();
            res.json({"code": 100, "status": "Error in connection database"});
            return;
        }
        connection.query("SELECT * FROM Meters", (err, rows) => {
            connection.release();
            if (!err) {
                res.json(rows);
            }
            else {
                console.log('Error while performing GET all meters query');
            }
        });
        connection.on('error', (err) => {
            res.json({"code": 100, "status": "Error in connection to database"});
        });
    });
});

/* GET a specific user by id */
router.get('/:meter_id', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            connection.release();
            res.json({"code": 100, "status": "Error in connection database"});
            return;
        }
        connection.query("SELECT * FROM Meters WHERE meter_id = ?", req.params.meter_id, (err, user) => {
            connection.release();
            if (!err) {
                res.json(user);
            }
            else {
                console.log('Error while performing GET specific meter by id query');
            }
        });
        connection.on('error', err => {
            res.json({"code": 100, "status": "Error in connection to database"});
        });
    });
});

module.exports = router;