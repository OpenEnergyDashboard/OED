/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { createConversionGraph } = require('./createConversionGraph');
const { createCikArray } = require('./createConversionArrays');
const Cik = require('../../models/Cik');
const { handleSuffixUnits} = require('./handleSuffixUnits');
const { getConnection } = require('../../db');
const { refreshAllReadingViews } = require('../../services/refreshAllReadingViews');

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
 * Needed to call from npm run. Give new name so hopefully won't use in regular code.
*/
async function updateCikAndViews() {
	const conn = getConnection();
	await redoCik(conn);
	// We need to update views if Cik changes.
	await refreshAllReadingViews();
}

module.exports = {
	redoCik,
	updateCikAndViews
};
