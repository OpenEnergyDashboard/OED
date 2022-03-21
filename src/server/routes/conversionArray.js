/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const { createConversionGraph } = require('../services/graph/createConversionGraph');
const { handleSuffixUnits } = require('../services/graph/handleSuffixUnits');
const { createCikArray, createPikArray } = require('../services/graph/createConversionArrays');

const router = express.Router();

/**
 * Route for getting the conversion array.
 */
router.get('/', async (req, res) => {
    const conn = getConnection();
    try {
        const conversionGraph = await createConversionGraph(conn);
        await handleSuffixUnits(conversionGraph, conn);
        const cik = await createCikArray(conversionGraph, conn);
        const pik = createPikArray(cik);
        res.json(pik);
    } catch (err) {
        log.error(`Error while performing GET conversion array query: ${err}`, err);
    }
});

module.exports = router;
