/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Unit = require('../../models/Unit');
const { pathConversion } = require('./pathConversion');
const Conversion = require('../../models/Conversion');
const { getAllPaths } = require('./createConversionGraph');

/**
 * Adds the new unit and conversions to the database and the conversion graph.
 * @param {*} sourceId The source unit's id.
 * @param {*} destinationId The destination unit's id.
 * @param {*} slope The conversion's slope from source to destination.
 * @param {*} intercept The conversion's intercept from source to destination.
 * @param {*} unitName The new unit's name.
 * @param {*} conn The connection to use.
 */
async function addNewUnitAndConversion(sourceId, destinationId, slope, intercept, unitName, graph, conn) {
	const sourceUnit = await Unit.getById(sourceId, conn);
	const destinationUnit = await Unit.getById(destinationId, conn);
	// Add a new units where: name and identifier is unitName, type_of_unit is Unit.type.suffix,
	// displayable and preferredDisplay is the same as destination.
	// Note a type_of_unit of suffix is different than a unit with a suffix string.
	// Note the admin can later change identifier, displayable and preferredDisplay to something else
	// since OED does not recreate the unit if it exists so those changes will stay.
	const newUnit = new Unit(undefined, unitName, unitName, Unit.unitRepresentType.UNUSED, sourceUnit.secInRate,
		Unit.unitType.SUFFIX, undefined, '', destinationUnit.displayable, destinationUnit.preferredDisplay, 'suffix unit created by OED');
	await newUnit.insert(conn);

	// Create the conversion from the prefix unit to this new unit.
	const newConversion = new Conversion(sourceId, newUnit.id, false, slope, intercept,
		`${sourceUnit.name} → ${newUnit.name} (created by OED for unit with prefix)`);
	await newConversion.insert(conn);

	// Add the new node and conversion to the graph.
	graph.addNode(newUnit.id, newUnit.name);
	graph.addLink(sourceId, newUnit.id);
}

/**
 * Verifies that the conversion from source to destination has not changed. If so, update the conversion.
 * @param {*} expectedSlope The expected slope.
 * @param {*} expectedIntercept The expected intercept.
 * @param {*} sourceId The source unit's id.
 * @param {*} destinationId The destination unit's id.
 * @param {*} conn The connection to use.
 */
async function verifyConversion(expectedSlope, expectedIntercept, sourceId, destinationId, conn) {
	const currentConversion = await Conversion.getBySourceDestination(sourceId, destinationId, conn);
	if (currentConversion.slope !== expectedSlope || currentConversion.intercept !== expectedIntercept) {
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
		if (secondUnit.unitType !== Unit.unitType.SUFFIX) {
			// Removes the conversion from the conversion graph.
			graph.removeLink(p[0].id, p[1].id);
			// Removes the conversion from the database.
			const conversion = await Conversion.getBySourceDestination(p[0].id, p[1].id, conn);
			if (conversion !== null) {
				await Conversion.delete(p[0].id, p[1].id, conn);
			}
		}
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
			// Find the conversion from the start to end of path.
			const [slope, intercept, suffix] = await pathConversion(p, conn);
			// Vertex's data is currently the unit's name.
			const destinationName = p[p.length - 1].data;
			// The name of the needed unit is the last unit name on the path + " of " and the suffix of the path.
			const unitName = destinationName + ' of ' + suffix;
			const neededSuffixUnit = await Unit.getByName(unitName, conn);
			// See if this unit already exists. Would if this was done before where this path existed.
			if (neededSuffixUnit === null) {
				// If not then add the new unit and conversion.
				await addNewUnitAndConversion(sourceId, destinationId, slope, intercept, unitName, graph, conn);
			} else {
				// If it already exists then check if the conversion is correct.
				await verifyConversion(slope, intercept, sourceId, neededSuffixUnit.id, conn);
			}
		}
		// The unit with suffix is no longer necessary since it has been replaced with new suffix units.
		// We need to hide it and remove unnecessary conversions.
		await hideSuffixUnit(unit, paths, graph, conn);
	}
}

module.exports = {
	handleSuffixUnits
};