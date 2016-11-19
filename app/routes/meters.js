let express = require('express');
const db = require('../../models/database');
let router = express.Router();

/* GET all meters */
router.get('/', (req, res) => {
    db.any("SELECT * FROM Meters")
        .then((rows) => {
            res.json(rows);
        })
        .catch(() => {
            console.log("Error while performing GET all meters query");
        });
});

/* GET a specific user by id */
router.get('/:meter_id', (req, res) => {
    db.one("SELECT * FROM Meters WHERE meter_id = ${meter_id}", {meter_id: req.params.meter_id})
        .then((row) => {
            res.json(row)
        })
        .catch(() => {
            console.log('Error while performing GET specific meter by id query');
        });
});

module.exports = router;