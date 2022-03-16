/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Unit = require('../../models/Unit');
const { getPath } = require('./createConversionGraph');
const { pathConversion } = require('./pathConversion');

/**
 * For each unit in the list, assigns its index to the conversion table.
 * For source units, the index is the row id.
 * For destination units, the index is the column id.
 * @param {*} units The list of units.
 * @param {*} conn The connection to use.
 */
async function assignIndex(units, conn) {
	let id = 0;
	// The old indices may cause conflicts while we are assigning new ones.
	// Therefore, we need to reset them to null first.
	for (let unit of units) {
		if (unit.unitIndex !== null) {
			unit.unitIndex = null;
			await unit.update(conn);
		}
	}
	// Assigns new indices.
	for (let unit of units) {
		unit.unitIndex = id;
		id += 1;
		await unit.update(conn);
	}
}

/**
 * Returns the Cik which gives the slope, intercept and suffix name between each meter and unit 
 * where it is NaN, Nan, '' if no conversion.
 * @param {*} graph The conversion graph.
 * @param {*} conn The connection to use.
 * @returns 
 */
async function createCikArray(graph, conn) {
	// Get the vertices associated with the sources (meters) and destinations (units) that can be displayed
	// to some user. admin covers everyone.
	// TODO: Get all meter units here may not be efficient since some of them are not necessary.
	const sources = await Unit.getTypeMeter(conn);
	const destinations = await Unit.getVisibleUnitOrSuffix(Unit.displayableType.ADMIN, conn);
	// Size of each of these.
	const numSources = sources.length;
	const numDestination = destinations.length;
	// Create an array to hold the values. Each entry will have double slope, double intercept, and string suffix.
	// [NaN, NaN, ''] means that there is no conversion.
	let c = new Array(numSources).fill(0).map(() => new Array(numDestination).fill([NaN, NaN, '']));
	await assignIndex(sources, conn);
	await assignIndex(destinations, conn);
	for (const source of sources) {
		for (const destination of destinations) {
			const sourceId = source.id;
			const destinationId = destination.id;
			// The shortest path from source to destination.
			const path = getPath(graph, sourceId, destinationId);
			// Check if the path exists.
			// If not, we will do nothing since the array has been initialized with [Nan, Nan, ''].
			if (path !== null) {
				const [slope, intercept, suffix] = await pathConversion(path, conn);
				// All suffix units were dealt in src/server/services/graph/handleSuffixUnits.js
				// so all units with suffix have displayable of none.
				// This means this path has a suffix of "" (empty) so it does not matter.
				// The name of any unit associated with a suffix was already set correctly.
				// Thus, we can just use the destination identifier as the unit name.
				c[source.unitIndex][destination.unitIndex] = [slope, intercept, destination.identifier];
			}
		}
	}
	// TODO: The table in the database for the logical Cik needs to be wiped and these values stored. This code 
	// will be added once the database table for using it to get readings is set.
	// At the moment, we just return the array.
	return c;
}

/**
 * Returns the Pik array which is true if there is a conversion in Cik.
 * @param {*} c The Cik array.
 * @returns
 */
function createPikArray(c) {
	// The number of sources and destinations.
	const numSources = c.length;
	const numDestination = c[0].length;
	let p = new Array(numSources).fill(0).map(() => new Array(numDestination).fill(true));
	for (let i = 0; i < numSources; ++i) {
		for (let j = 0; j < numDestination; ++j) {
			// If the conversion exists, we do nothing since Pij has been initialized with true.
			// If not, we need to set Pij to false.
			if (isNaN(c[i][j][0])) {
				p[i][j] = false;
			}
		}
	}
	return p;
}

module.exports = {
	createCikArray,
	createPikArray
}