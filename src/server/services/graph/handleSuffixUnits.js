/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Unit = require('../../models/Unit');
const { pathConversion } = require('./pathConversion');
const Conversion = require('../../models/Conversion');
const { getAllPaths } = require('./createConversionGraph');
const { log } = require('../../log');
const { deleteUnitSafely } = require('./checkUnitDependencies');

/**
 * Adds the new unit and conversions to the database and the conversion graph.
 * @param {*} sourceId The source unit's id.
 * @param {*} destinationId The destination unit's id.
 * @param {*} slope The conversion's slope from source to destination.
 * @param {*} intercept The conversion's intercept from source to destination.
 * @param {*} unitName The new unit's name.
 * @param {*} unitIdentifier The new unit's identifier.
 * @param {*} conn The connection to use.
 */
async function addNewUnitAndConversion(sourceId, destinationId, slope, intercept, unitName, unitIdentifier, graph, conn) {
	const sourceUnit = await Unit.getById(sourceId, conn);
	const destinationUnit = await Unit.getById(destinationId, conn);
	// Add a new units where: name is unitName, identifier is unitIdentifier, type_of_unit is Unit.type.suffix,
	// displayable and preferredDisplay is the same as destination.
	// Note a type_of_unit of suffix is different than a unit with a suffix string.
	// Note the admin can later change identifier, displayable and preferredDisplay to something else
	// since OED does not recreate the unit if it exists so those changes will stay.
	const newUnit = new Unit(undefined, unitName, unitIdentifier, destinationUnit.unitRepresent, sourceUnit.secInRate,
		Unit.unitType.SUFFIX, '', destinationUnit.displayable, destinationUnit.preferredDisplay, 'suffix unit created by OED');
	await newUnit.insert(conn);

	// Create the conversion from the prefix unit to this new unit.
	const newConversion = new Conversion(sourceId, newUnit.id, false, slope, intercept,
		`${sourceUnit.name} → ${newUnit.name} (created by OED for unit with suffix)`);
	await newConversion.insert(conn);

	// Add the new node and conversion to the graph.
	graph.addNode(newUnit.id, newUnit.name);
	graph.addLink(sourceId, newUnit.id);
}

/**
 * Verifies that the conversion from source to destination has not changed. If so, update the conversion.
 * @param {*} expectedSlope The expected slope.
 * @param {*} expectedIntercept The expected intercept.
 * @param {*} source The source unit.
 * @param {*} destination The destination unit.
 * @param {*} graph The conversion graph.
 * @param {*} conn The connection to use.
 */
async function verifyConversion(expectedSlope, expectedIntercept, source, destination, graph, conn) {
	const sourceId = source.id;
	const destinationId = destination.id;
	const currentConversion = await Conversion.getBySourceDestination(sourceId, destinationId, conn);
	if (!currentConversion) {
		// The destination suffix unit exists but the conversion doesn't.
		// Create a new conversion with desired values.
		const newConversion = new Conversion(sourceId, destinationId, false, expectedSlope, expectedIntercept,
			`${source.name} → ${destination.name} (created by OED for unit with suffix)`);
		// Insert the new conversion to database and graph.
		await newConversion.insert(conn);
		graph.addLink(sourceId, destinationId);
	} else if (currentConversion.slope !== expectedSlope || currentConversion.intercept !== expectedIntercept) {
		// While unlikely, the conversion changed so update
		currentConversion.slope = expectedSlope;
		currentConversion.intercept = expectedIntercept;
		await currentConversion.update(conn);
	}
}

/**
 * This function is called after adding suffix units. These new units will replace
 * the original one so we need to hide and remove all the edges from it to others.
 * @param {*} unit The suffix unit to hide.
 * @param {*} paths All shortest paths from this suffix unit to others.
 * @param {*} graph The conversion graph.
 * @param {*} conn The connection to use.
 */
async function hideSuffixUnit(unit, paths, graph, conn) {
	// Hides the suffix unit since we added the units based on it if not previously done.
	if (unit.displayable !== Unit.displayableType.NONE) {
		unit.displayable = Unit.displayableType.NONE;
		await unit.update(conn);
	}
	// Remove the edge from this unit to the next vertex that existed before the new units were added
	// since it is no longer needed as the new suffix units have the needed edges (conversions). 
	// The created units have the type_of_unit be suffix so don't delete those. 
	// There is probably only one edge but remove them all just in case.
	for (const p of paths) {
		const secondUnit = await Unit.getById(p[1].id, conn);
		// The paths to suffix units shouldn't be deleted.
		if (secondUnit.typeOfUnit !== Unit.unitType.SUFFIX) {
			// Removes the conversion from the conversion graph.
			graph.removeLink(p[0].id, p[1].id);
		}
	}
}

/**
 * Check if the suffix unit's displayable is the same as the destination unit.
 * @param {*} suffixUnit The suffix unit to check.
 * @param {*} destinationId The destination unit's id
 * @param {*} conn The connection to use.
 */
async function verifyUnit(suffixUnit, destinationId, conn) {
	const destinationUnit = await Unit.getById(destinationId, conn);
	if (suffixUnit.displayable !== destinationUnit.displayable) {
		suffixUnit.displayable = destinationUnit.displayable;
		await suffixUnit.update(conn);
	}
}

/**
 * Adds new suffix units and conversions to the database and the conversion graph.
 * @param {*} graph The conversion graph. 
 * @param {*} conn The connection to use.
 */
async function handleSuffixUnits(graph, conn) {
	// Get all units that have a suffix.
	const suffixUnits = await Unit.getSuffix(conn);
	// Check each unit out.
	for (const unit of suffixUnits) {
		// Use the graph to determine all the reachable units from this suffix unit S.
		const paths = getAllPaths(graph, unit.id);
		// Analyze each path
		for (const p of paths) {
			const sourceId = p[0].id;
			const destinationId = p[p.length - 1].id;
			// The destination unit.
			const destinationUnit = await Unit.getById(destinationId, conn);
			// We don't need to create any new units/conversions if the destination unit has the type of suffix or it's not displayed.
			if (destinationUnit.typeOfUnit === Unit.unitType.SUFFIX || destinationUnit.displayable === Unit.displayableType.NONE) {
				continue;
			}
			// Find the conversion from the start to end of path.
			const [slope, intercept, suffix] = await pathConversion(p, conn);
			// The name of the needed unit is the last unit name on the path + " of " and the suffix of the path.
			const unitName = destinationUnit.name + ' of ' + suffix;
			const unitIdentifier = destinationUnit.identifier + ' of ' + suffix;
			const neededSuffixUnit = await Unit.getByName(unitName, conn);
			// See if this unit already exists. Would if this was done before where this path existed.
			if (neededSuffixUnit === null) {
				// If not then add the new unit and conversion.
				await addNewUnitAndConversion(sourceId, destinationId, slope, intercept, unitName, unitIdentifier, graph, conn);
			} else {
				// If it already exists then check if the unit and conversion are correct.
				await verifyUnit(neededSuffixUnit, destinationId, conn);
				await verifyConversion(slope, intercept, unit, neededSuffixUnit, graph, conn);
			}
		}
		// The unit with suffix is no longer necessary since it has been replaced with new suffix units.
		// We need to hide it and remove unnecessary conversions.
		await hideSuffixUnit(unit, paths, graph, conn);
	}
}

/**
 * OED handles suffix units by adding conversions and units automatically.
 * When a unit's suffix changes, these additional conversions and units need to be removed.
 * Each conversion and OED created unit is cleaned up independently.
 * Cik must be recalculated after calling this function.
 * @param {*} suffixUnit Additional conversions/units of this suffixUnit will be removed.
 * @param {*} conn The connection to use (can be a transaction).
 * @param {number} depth Current recursion depth to prevent infinite loops (default: 0).
 */

async function removeAdditionalConversionsAndUnits(suffixUnit, conn, depth = 0) {
	const MAX_SUFFIX_CLEANUP_DEPTH = 10;

	if (depth > MAX_SUFFIX_CLEANUP_DEPTH) {
		log.error(`Max depth (${MAX_SUFFIX_CLEANUP_DEPTH}) reached cleaning up suffix unit ${suffixUnit.id}. Possible circular dependency.`);
		throw new Error(`Suffix unit cleanup depth limit exceeded for unit ${suffixUnit.id}`);
	}
	// Track units being deleted to notify admin of the internal change

	while (true) {
		// Get all conversions involving this suffix unit (as source, destination, or bidirectional)
		const allConversions = await Conversion.getAll(conn);
		const relatedConversions = allConversions.filter((conversion) =>
			conversion.sourceId === suffixUnit.id ||
			(conversion.bidirectional && conversion.destinationId === suffixUnit.id)
		);
		if (relatedConversions.length === 0) {
			break;
		}

		const resolved = await Promise.all(relatedConversions.map(async (conversion) => {
			// Determine which unit is the suffix unit and which is the destination
			const isSource = conversion.sourceId === suffixUnit.id;
			const otherUnitId = isSource ? conversion.destinationId : conversion.sourceId;
			const exists = await Unit.exists(otherUnitId, conn);
			const otherUnit = exists ? await Unit.getById(otherUnitId, conn) : null;  
			return { conversion, otherUnitId, otherUnit };
		}));

		// Handle a conversion pointing at a unit that's already been deleted.
		// This occurs when a bidirectional conversion is stored as two rows.
		// Both rows point to the same otherUnitId. If an earlier processing pass deleted
		// otherUnitId during the same batch, this lookup will correctly register it as
		// missing rather than indicating an actual data problem.
		const missing = resolved.find(r => !r.otherUnit);
		if (missing) {
			log.warn(`Unit ${missing.otherUnitId} not found when cleaning up suffix unit ${suffixUnit.id}. Conversion ${missing.conversion.sourceId}->${missing.conversion.destinationId} may be orphaned.`);
			await Conversion.delete(missing.conversion.sourceId, missing.conversion.destinationId, conn);
			continue;
		}

		// Find the first related conversion whose other unit is actually a
		// suffix-type unit this function is responsible for cleaning up.
		// Conversions to non-suffix units (e.g. the original conversion the
		// admin is deleting) are left alone rather than aborting the loop.
		const target = resolved.find(r => r.otherUnit.typeOfUnit === Unit.unitType.SUFFIX);
	
		if (!target) {
			// Nothing left to process for this unit.
			break;
		}

		// The units that OED adds are suffix units (typeOfUnit === SUFFIX)
		try {
			const {conversion, otherUnitId, otherUnit } = target;

			// Check if otherUnitId has connections besides this one.
			// Deletion of other connections may lead to orphaning a unit.
			const otherUnitConversions = await Conversion.getConversionsByUnitID(otherUnitId, conn);
			const hasOtherConnections = otherUnitConversions.some(c =>
				!((c.source_id === conversion.sourceId && c.destination_id === conversion.destinationId) ||
          		(c.source_id === conversion.destinationId && c.destination_id === conversion.sourceId))
    		);
			// Warn the admin of connected units
			if (hasOtherConnections) {
				log.warn(`Unit ${otherUnitId} has other connections beyond conversion ${conversion.sourceId}->${conversion.destinationId}; deleting it will also remove those.`);
   			}
		
			// Always delete the conversion
			await Conversion.delete(conversion.sourceId, conversion.destinationId, conn);

			// If bidirectional, also delete the reverse conversion if it exists separately
			if (conversion.bidirectional) {
				const reverseConversion = await Conversion.getBySourceDestination(
					conversion.destinationId,
					conversion.sourceId,
					conn
				);
				if (reverseConversion) {
					await Conversion.delete(conversion.destinationId, conversion.sourceId, conn);
				}
			}

			// Recursively clean up this unit's related conversions/units
			// This handles nested suffix chains (A -> B -> C)
			await removeAdditionalConversionsAndUnits(otherUnit, conn, depth + 1);

			// Delete the auto-created unit (dependency checks + cik cleanup handled inside)
			await deleteUnitSafely(otherUnitId, conn);
		
		} catch (err) {
			log.error(`Error processing conversion ${conversion.sourceId}->${conversion.destinationId} during suffix unit cleanup: ${err}`, err);
			throw err;
		}
	}

	// Restore the suffix unit's displayable status
	suffixUnit.displayable = Unit.displayableType.ALL;
	await suffixUnit.update(conn);
	}

module.exports = {
	handleSuffixUnits,
	removeAdditionalConversionsAndUnits
};
