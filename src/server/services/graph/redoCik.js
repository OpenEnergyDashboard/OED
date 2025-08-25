/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { createConversionGraph, createConversionSegmentGraph } = require('./createConversionGraph');
const { createCikArray, createCikVaryArray } = require('./createConversionArrays');
const Cik = require('../../models/Cik');
const CikVary = require('../../models/CikVary');
const { handleSuffixUnits } = require('./handleSuffixUnits');
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

/**
 * Creates CikVary based on units and conversion segments and then inserts these values
 * in the cik_vary table in the database.
 */
async function redoCikVary(conn) {
	// Create graph based on units and conversion segments.
	const graph = await createConversionGraph(conn);
	console.log('Graph created with nodes:', graph.getNodesCount(), 'and links:', graph.getLinksCount());
	// Processes suffix units to update graph and database (not used for now).
	// await handleSuffixUnits(graph, conn);
	// Uses final graph to create cik_vary array.
	const cikVary = await createCikVaryArray(graph, conn);
	console.log('cikVary array to insert:', cikVary);
	// Inserts cik_vary array into database where old values are deleted.
	await CikVary.insert(cikVary, conn);
}

/**
 * Needed to call from npm run for CikVary. Give new name so hopefully won't use in regular code.
*/
async function updateCikVaryAndViews() {
	const conn = getConnection();
	await redoCikVary(conn);
	// We need to update views if CikVary changes.
	await refreshAllReadingViews();
}

module.exports = {
	redoCik,
	updateCikAndViews,
	redoCikVary,
	updateCikVaryAndViews
};
