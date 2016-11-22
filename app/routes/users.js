let express = require('express');
const User = require('../../models/Meter');
let router = express.Router();

/* GET all users */
router.get('/', (req, res) => {
    User.getAll().then((rows) => {
        res.json(rows);
    });
});

/* GET a specific user by id */
router.get('/:user_id', (req, res) => {
    User.getByID(req.params.user_id).then((rows) => {
        res.json(rows);
    });
});

module.exports = router;