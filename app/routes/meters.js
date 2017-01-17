let express = require('express');
const Meter = require('../../models/Meter');
let router = express.Router();

/* GET all meters */
router.get('/', (req, res) => {
    Meter.getAll().then((rows) => {
        res.json(rows);
    }).catch((err) => {
        console.log('Error while performing GET all meters query: ' + err);
    });
});

/* GET a specific user by id */
router.get('/:meter_id', (req, res) => {
    Meter.getByID(req.params.meter_id).then((rows) => {
        res.json(rows);
    }).catch((err) => {
        console.log('Error while performing GET specific meter by id query: ' + err);
    });
});

module.exports = router;