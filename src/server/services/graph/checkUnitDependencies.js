/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Meter = require('../../models/Meter');
const Group = require('../../models/Group');
const Conversion = require('../../models/Conversion');

/**
 * Checks if a unit has dependencies that prevent safe deletion.
 * @param {number} unitId The unit ID to check
 * @param {*} conn Database connection (can be a transaction)
 * @returns {Promise<Object>} Object with hasDependencies boolean and details
 */
async function checkUnitDependencies(unitId, conn) {
	const [meters, groups, conversions] = await Promise.all([
		// Check if any meters use this unit (as unitId or default_graphic_unit)
		conn.any(`
			SELECT id, name, unit_id, default_graphic_unit 
			FROM meters 
			WHERE unit_id = $1 OR default_graphic_unit = $1
		`, [unitId]),
		
		// Check if any groups use this unit as default_graphic_unit
		conn.any(`
			SELECT id, name, default_graphic_unit 
			FROM groups 
			WHERE default_graphic_unit = $1
		`, [unitId]),
		
		// Check if unit is used in any conversions (as source or destination)
		conn.any(`
			SELECT source_id, destination_id, bidirectional 
			FROM conversions 
			WHERE source_id = $1 OR destination_id = $1
		`, [unitId])
	]);
	
	return {
		hasDependencies: meters.length > 0 || groups.length > 0 || conversions.length > 0,
		meters,
		groups,
		conversions
	};
}

/**
 * Checks if a suffix-type unit (created by OED) can be safely hidden.
 * These units should only be hidden if they're not used by meters/groups.
 * Conversions are expected and will be cleaned up separately.
 * @param {number} unitId The suffix unit ID to check
 * @param {*} conn Database connection (can be a transaction)
 * @returns {Promise<boolean>} True if safe to hide
 */
async function canSafelyHideSuffixUnit(unitId, conn) {
	const deps = await checkUnitDependencies(unitId, conn);
	// Suffix units created by OED can be hidden if no meters/groups depend on them
	// (conversions are expected and will be cleaned up)
	return deps.meters.length === 0 && deps.groups.length === 0;
}

/**
 * Gets detailed dependency information for UI warnings.
 * @param {number} unitId The unit ID to check
 * @param {*} conn Database connection
 * @returns {Promise<Object>} Detailed dependency info
 */
async function getUnitDependencyDetails(unitId, conn) {
	const deps = await checkUnitDependencies(unitId, conn);
	
	return {
		hasDependencies: deps.hasDependencies,
		meterCount: deps.meters.length,
		groupCount: deps.groups.length,
		conversionCount: deps.conversions.length,
		meters: deps.meters.map(m => ({ id: m.id, name: m.name })),
		groups: deps.groups.map(g => ({ id: g.id, name: g.name })),
		conversions: deps.conversions.map(c => ({
			sourceId: c.source_id,
			destinationId: c.destination_id,
			bidirectional: c.bidirectional
		}))
	};
}

module.exports = {
	checkUnitDependencies,
	canSafelyHideSuffixUnit,
	getUnitDependencyDetails
};