/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Meter = require('../../models/Meter');
const Group = require('../../models/Group');
const Conversion = require('../../models/Conversion');
const Unit = require('../../models/Unit');
const { log } = require('../../log');

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

/**
 * Deletes a single unit, clearing all dependencies that would otherwise block it.
 * If it's used as a meter's or group's default graphic unit, that reference is
 * cleared first (cosmetic, safe to drop). If it's used as a meter's actual base
 * unit (unit_id), that reference is also cleared (the meter is left without a
 * defined unit) so the deletion can proceed. Any other conversions still
 * referencing this unit are deleted as well. Also clears any stale cik rows
 * @param {number} unitId The unit to delete.
 * @param {*} conn The connection to use (should be a transaction).
 */
async function deleteUnitSafely(unitId, conn) {
	const deps = await checkUnitDependencies(unitId, conn);

	// Clear any meter using this as its base unit or default graphic unit.
	for (const meter of deps.meters) {
		if (meter.unit_id === unitId) {
			log.warn(`Clearing base unit for meter "${meter.name}" (ID: ${meter.id}) to allow deletion of unit ${unitId}.`);
			await conn.none('UPDATE meters SET unit_id = NULL WHERE id = $1', [meter.id]);
		}
		if (meter.default_graphic_unit === unitId) {
			await conn.none('UPDATE meters SET default_graphic_unit = NULL WHERE id = $1', [meter.id]);
		}
	}

	// Clear any group using this as its default graphic unit.
	for (const group of deps.groups) {
		await conn.none('UPDATE groups SET default_graphic_unit = NULL WHERE id = $1', [group.id]);
	}

	// Delete any other conversions still referencing this unit.
	for (const conv of deps.conversions) {
		log.info(`Deleting conversion ${conv.source_id}->${conv.destination_id} to allow deletion of unit ${unitId}.`);
		await conn.none('DELETE FROM conversions WHERE source_id = $1 AND destination_id = $2', [conv.source_id, conv.destination_id]);
	}

	await conn.none('DELETE FROM cik WHERE source_id = $1 OR destination_id = $1', [unitId]);
	await Unit.delete(unitId, conn);
}

module.exports = {
	checkUnitDependencies,
	canSafelyHideSuffixUnit,
	getUnitDependencyDetails,
	deleteUnitSafely
};