/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { getConnection } = require('../db');
const Cik = require('../models/Cik');
const { success, failure } = require('./response');
const { HTTP_CODES } = require('../util/httpCodes');

const router = express.Router();

module.exports = router;

function formatCikForResponse(item) {
  return {
    meterUnitId: item.meterUnitId,
    nonMeterUnitId: item.nonMeterUnitId,
    slope: item.slope,
    intercept: item.intercept
  }
}

/**
 * Router for getting all ciks.
 */
router.get('/', async (req, res) => {
  const conn = getConnection();
  try {
    const rows = await Cik.getAll(conn);
    success(res, rows.map(formatCikForResponse));
  } catch (err) {
    failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while performing GET ciks details query: ${err.message}`, { cause: err }));
  }
});