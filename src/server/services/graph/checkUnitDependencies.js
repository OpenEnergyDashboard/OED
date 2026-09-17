/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Meter = require('../../models/Meter');
const Group = require('../../models/Group');
const Conversion = require('../../models/Conversion');
const Unit = require('../../models/Unit');
const { log } = require('../../log');
const Cik = require('../../models/Cik');

/**
 * Checks if a unit has dependencies that prevent safe deletion.
 * @param {number} unitId The unit ID to check
 * @param {*} conn Database connection (can be a transaction)
 * @returns {Promise<Object>} Object containing:
 *   - hasDependencies {boolean} Whether the unit has any dependencies
 *   - meters {Array} Meters using the unit
 *   - groups {Array} Groups using the unit
 *   - conversions {Array} Conversions using the unit
 */
async function checkUnitDependencies(unitId, conn) {
	const [meters, groups, conversions] = await Promise.all([
		// Check if any meters use this unit (as unitId or default_graphic_unit)
		Meter.getByUnitOrDefaultGraphic(unitId, conn),
		// Check if any groups use this unit as default_graphic_unit
		Group.getByDefaultGraphicUnit(unitId, conn),
		// Check if unit is used in any conversions (as source or destination)
		Conversion.getConversionsByUnitID(unitId,conn)
	]);
	
	return {
		hasDependencies: meters.length > 0 || groups.length > 0 || conversions.length > 0,
		meters,
		groups,
		conversions
	};
}

/**
 * Checks if a unit has any other conversions beyond the one specified.
 * Used to detect whether deleting a conversion would sever connections
 * that an admin may not expect. Like orphaning a unit via cascade deletion.
 * @param {number} unitId The unit to check.
 * @param {number} excludeSourceId The source id of the conversion to exclude from the check.
 * @param {number} excludeDestinationId The destination id of the conversion to exclude from the check.
 * @param {*} conn The connection to use.
 * @returns {Promise.<Array>} The other conversions, if any.
 */
async function getOtherConnections(unitId, excludeSourceId, excludeDestinationId, conn) {
	const allConversions = await Conversion.getConversionsByUnitID(unitId, conn);
	// Exclude converstions that contain the source or destination Id provided from results
	return allConversions.filter( conv =>
		!((conv.sourceId === excludeSourceId && conv.destinationId === excludeDestinationId) ||
		(conv.sourceId === excludeDestinationId && conv.destinationId === excludeSourceId))
	);
}

/**
 * Gets detailed dependency information for UI warnings.
 * @param {number} unitId The unit ID to check
 * @param {*} conn Database connection
 * @returns {Promise<Object>} Object containing:
 *   hasDependencies: boolean,
 *   meterCount: number,
 *   groupCount: number,
 *   conversionCount: number,
 *   meters: Array,
 *   groups: Array,
 *   conversions: Array
 */
async function getUnitDependencyDetails(unitId, conn) {
	const deps = await checkUnitDependencies(unitId, conn);
	
	return {
		hasDependencies: deps.hasDependencies,
		meterCount: deps.meters.length,
		groupCount: deps.groups.length,
		conversionCount: deps.conversions.length,
		meters: deps.meters.map(meter => ({ id: meter.id, name: meter.name })),
		groups: deps.groups.map(group => ({ id: group.id, name: group.name })),
		conversions: deps.conversions.map(conv => ({
			sourceId: conv.source_id,
			destinationId: conv.destination_id,
			bidirectional: conv.bidirectional
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