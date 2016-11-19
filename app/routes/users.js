let express = require('express');
const db = require('../../models/database');
let router = express.Router();

/* GET all users */
router.get('/', (req, res) => {
    db.any("SELECT * FROM Users")
        .then((rows) => {
            res.json(rows);
        })
        .catch(() => {
            console.log("Error while performing GET all users query");
        });
});

/* GET a specific user by id */
router.get('/:user_id', (req, res) => {
    db.one("SELECT * FROM Users WHERE user_id = ${user_id}", {user_id: req.params.user_id})
        .then((row) => {
            res.json(row)
        })
        .catch(() => {
            console.log('Error while performing GET specific user by id query');
        });
});

module.exports = router;