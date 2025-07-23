/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const CikVary = require('../models/CikVary');

const router = express.Router();

function formatCikVaryForResponse(item) {
  return {
    meterUnitId: item.meterUnitId,
    nonMeterUnitId: item.nonMeterUnitId,
    startTime: item.startTime,
    endTime: item.endTime,
    slope: item.slope,
    intercept: item.intercept
  };
}

/**
 * Route for getting all CikVary entries.
 */
router.get('/', async (req, res) => {
  const conn = getConnection();
  try {
    const rows = await CikVary.getAll(conn);
    res.json(rows.map(formatCikVaryForResponse));
  } catch (err) {
    log.error(`Error while performing GET cikVary details query: ${err}`);
    res.sendStatus(500);
  }
});

/**
 * Route for getting CikVary entries for a specific edge (sourceId, destinationId).
 * Optional: filter by time with queryTime param.
 */
router.get('/edge', async (req, res) => {
  const conn = getConnection();
  const { sourceId, destinationId, queryTime } = req.query;
  try {
    let rows;
    if (queryTime) {
      rows = await CikVary.getConversionAtTime(conn, Number(sourceId), Number(destinationId), queryTime);
    } else {
      rows = await CikVary.getAllForEdge(conn, Number(sourceId), Number(destinationId));
    }
    res.json(rows.map(formatCikVaryForResponse));
  } catch (err) {
    log.error(`Error while performing GET cikVary edge query: ${err}`);
    res.sendStatus(500);
  }
});

module.exports = router;
