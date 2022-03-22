/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const Unit = require('../models/Unit');

const router = express.Router();

function formatUnitForResponse(item) {
    return { id: item.id, name: item.name, identifier: item.identifier, unitRepresent: item.unitRepresent, 
        secInRate: item.secInRate, typeOfUnit: item.typeOfUnit, unitIndex: item.unitIndex, suffix: item.suffix, 
        displayable: item.displayable, preferredDisplay: item.preferredDisplay, note: item.note };
}

/**
 * Route for getting the conversion array.
 */
router.get('/', async (req, res) => {
    const conn = getConnection();
    try {
        const rows = await Unit.getAll(conn);
        res.json(rows.map(formatUnitForResponse));
    } catch (err) {
        log.error(`Error while performing GET units details query: ${err}`, err);
    }
});

module.exports = router;