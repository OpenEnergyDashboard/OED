/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const Timezone = require('../models/Timezone')
const { log } = require('../log');
const { getConnection } = require('../db');

const router = express.Router()

router.get('/', async (req, res) => {
    console.log('here');
    const conn = getConnection();
    try {
        const rows = await Timezone.getAllTimezones(conn);
        console.log(rows)
        res.json(rows);
    } catch (err) {
        log.error(`Error while performing GET all timezones query: ${err}`, err);
    }
}
)
module.exports = router;