/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { createConversionGraph } = require('./createConversionGraph');
const { createCikArray } = require('./createConversionArrays');
const { getConnection } = require('../../db');
const Cik = require('../../models/Cik');
const { handleSuffixUnits} = require('./handleSuffixUnits');

/**
 * Creates Cik based on units and conversions and then inserts these values
 * in the cik table in the database.
 */
async function redoCik(conn) {
	// Create graph based on units and conversions.
	const graph = await createConversionGraph(conn);
	// Processes suffix units to update graph and database.
	await handleSuffixUnits(graph, conn);
	// Uses final graph to create cik array.
	const cik = await createCikArray(graph, conn);
	// Inserts cik array into database where old values are deleted.
	await Cik.insert(cik, conn);
}

/**
 * Uses the cik table to create a Pik array and return it.
 */
async function createPik(conn) {
	pik = await Cik.getPik(conn);
	return pik;
}

module.exports = {
	redoCik,
	createPik
};
