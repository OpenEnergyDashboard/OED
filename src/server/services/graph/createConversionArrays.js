/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { SemicolonPreference } = require('typescript');
const Unit = require('../../models/Unit');
const { getPath } = require('./createConversionGraph');
const { pathConversion } = require('./pathConversion');

/**
 * Returns the Cik which gives the slope, intercept and suffix name between each meter and unit 
 * where it is NaN, Nan, '' if no conversion.
 * @param {*} graph The conversion graph.
 * @param {*} conn The connection to use.
 * @returns 
 */
async function createCikArray(graph, conn) {
	// Get the vertices associated with the sources (meters) and destinations (units, suffix).
	// In principle we could just get units associated with meters that have a visible meter since only
	// those can be used. However, this means we would need to update Cik if an admin updates the visibility of
	// a meter or adds a new meter that is visible and associated with a meter unit that was not in Cik.
	// To avoid having to redo Cik for any meter update, all meter units are included. Note it is less likely
	// that there is an unused meter unit.
	// For units of type unit or suffix, we could exclude any that no user can see. While this might eliminate
	// some units, the number that are not visible to an admin is likely to be small. As with meter units, OED
	// would need to update Cik if any unit has its visible status changed. Not doing this avoids having to update
	// Cik on unit changes (only on conversion change because adding a new unit that has no conversion means
	// all its values in Cik would indicate no conversion). Note we do exclude if displayable is none
	// since those cannot be graphed. The original unit with a suffix string is excluded by OED during
	// processing of suffix units.
	// The final consideration is how much including the extra items will cost. The larger array should not impact
	// the speed of looking up an item in Cik. Sending Cik to the client will be larger but note that if
	// there are 30 meter units and 100 unit/suffix units then Cik has 3000 items. This will
	// not be large, esp. compared to the rest of the startup payload of code. Thus, including all the
	// units should still be very efficient and the bytes saved by doing all the extra work above will be small.
	const sources = await Unit.getTypeMeter(conn);
	// This excludes units that have displayable none since cannot be graphed.
	const destinations = (await Unit.getTypeUnit(conn)).concat(await Unit.getTypeSuffix(conn));
	// Size of each of these.
	// Create an array to hold the values. Each entry will have integer souce it, integer destination id, double slope,
	// double intercept, and string suffix.
	const c = [];
	for (const source of sources) {
		for (const destination of destinations) {
			const sourceId = source.id;
			const destinationId = destination.id;
			// The shortest path from source to destination.
			const path = getPath(graph, sourceId, destinationId);
			// Check if the path exists.
			// If not, we will do nothing since the array has been initialized with [Nan, Nan, ''].
			if (path !== null) {
				const [slope, intercept] = await pathConversion(path, conn);
				// All suffix units were dealt in src/server/services/graph/handleSuffixUnits.js
				// so all units with suffix have displayable of none.
				// This means this path has a suffix of "" (empty) so it does not matter.
				// The name of any unit associated with a suffix was already set correctly.
				// Thus, we can just use the destination identifier as the unit name.
				c.push({ source: sourceId, destination: destinationId, slope: slope, intercept: intercept });
			}
		}
	}
	// TODO: The table in the database for the logical Cik needs to be wiped and these values stored. This code 
	// will be added once the database table for using it to get readings is set.
	// At the moment, we just return the array.
	return c;
}

module.exports = {
	createCikArray
}
