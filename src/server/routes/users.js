let express = require('express');
const User = require('../models/User');
let router = express.Router();

/* GET all users */
router.get('/', (req, res) => {
    User.getAll().then((rows) => {
        res.json(rows);
    }).catch((err) => {
        console.log('Error while performing GET all users query: ' + err);
    });
});

/* GET a specific user by id */
router.get('/:user_id', (req, res) => {
    User.getByID(req.params.user_id).then((rows) => {
        res.json(rows);
    }).catch((err) => {
        console.log('Error while performing GET specific user by id query: ' + err);
    });
});

module.exports = router;