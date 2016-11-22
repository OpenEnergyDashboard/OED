let express = require('express');
const Meter = require('../../models/Meter');
let router = express.Router();

/* GET all meters */
router.get('/', (req, res) => {
    Meter.getAll().then((rows) => {
        res.json(rows);
    });
});

/* GET a specific user by id */
router.get('/:meter_id', (req, res) => {
    Meter.getByID(req.params.meter_id).then((rows) => {
        res.json(rows);
    });
});

module.exports = router;