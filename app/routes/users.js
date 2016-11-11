let express = require('express');
let pool = require('./../../models/pool.js').pool;
let router = express.Router();

/* GET all users */
router.get('/', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            connection.release();
            res.json({"code": 100, "status": "Error in connection database"});
            return;
        }
        connection.query("SELECT * FROM Users", (err, rows) => {
            connection.release();
            if (!err) {
                res.json(rows);
            }
            else {
                console.log('Error while performing GET all users query');
            }
        });
        connection.on('error', err => {
            res.json({"code": 100, "status": "Error in connection to database"});
        });
    });
});

/* GET a specific user by id */
router.get('/:user_id', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            connection.release();
            res.json({"code": 100, "status": "Error in connection database"});
            return;
        }
        connection.query("SELECT * FROM Users WHERE user_id = ?", req.params.user_id, (err, user) => {
            connection.release();
            if (!err) {
                res.json(user);
            }
            else {
                console.log('Error while performing GET specific user by id query');
            }
        });
        connection.on('error', err => {
            res.json({"code": 100, "status": "Error in connection to database"});
        });
    });
});

module.exports = router;