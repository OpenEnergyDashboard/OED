/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { createCikArray } = require('./graph/createConversionArrays');
const Conversion = require('../models/Conversion');
const Meter = require('../models/Meter');
const Group = require('../models/Group');
const Unit = require('../models/Unit');
const { createConversionGraph, createConversionGraphFromArray } = require('./graph/createConversionGraph');
const { intersectSets, compatibleUnitsForMeter } = require('../util/compatibleUnits');

/**
 * Simulates what conversions and units would be removed when deleting a conversion involving suffix units.
 * This mirrors the logic in removeAdditionalConversionsAndUnits but without actually deleting.
 * @param {*} suffixUnit The suffix unit to check
 * @param {*} allConversions All conversions in the system
 * @param {*} allUnits All units in the system
 * @returns {Object} Object with arrays of conversionIds and unitIds that would be removed
 */
function simulateSuffixUnitCleanup(suffixUnit, allConversions, allUnits) {
	const conversionsToRemove = [];
	const unitsToHide = [];
	
	// Find all conversions involving this suffix unit
	const relatedConversions = allConversions.filter((conversion) => 
		conversion.sourceId === suffixUnit.id || 
		conversion.destinationId === suffixUnit.id ||
		(conversion.bidirectional && (conversion.sourceId === suffixUnit.id || conversion.destinationId === suffixUnit.id))
	);
	
	// Process each related conversion
	for (const conversion of relatedConversions) {
		const isSource = conversion.sourceId === suffixUnit.id;
		const otherUnitId = isSource ? conversion.destinationId : conversion.sourceId;
		const otherUnit = allUnits.find(u => u.id === otherUnitId);
		
		// If the other unit is also a suffix unit (created by OED), it would be hidden
		if (otherUnit && otherUnit.typeOfUnit === Unit.unitType.SUFFIX) {
			conversionsToRemove.push({
				sourceId: conversion.sourceId,
				destinationId: conversion.destinationId
			});
			
			// If bidirectional, also mark reverse for removal
			if (conversion.bidirectional) {
				conversionsToRemove.push({
					sourceId: conversion.destinationId,
					destinationId: conversion.sourceId
				});
			}
			
			if (!unitsToHide.includes(otherUnitId)) {
				unitsToHide.push(otherUnitId);
			}
		}
	}
	
	return { conversionsToRemove, unitsToHide };
}
async function simulateDeleteConversion({ sourceId, destinationId }, conn) {

	// 1. Load all data
	const [allConversions, allMeters, allUnits, allGroups] = await Promise.all([
		Conversion.getAll(conn),
		Meter.getAll(conn),
		Unit.getAll(conn),
		Group.getAll(conn)
	]);

	// 2. Get source and destination units to check for suffix units
	const sourceUnit = allUnits.find(u => u.id === sourceId);
	const destUnit = allUnits.find(u => u.id === destinationId);
	
	// 3. Simulate suffix unit cleanup if applicable
	let conversionsToRemove = [
		{ sourceId, destinationId } // The conversion being deleted
	];
	
	const isSuffixRelated = (unit) => unit && (unit.typeOfUnit === 'suffix' || (unit.suffix && unit.suffix.trim() !== ''));

	if (isSuffixRelated(sourceUnit)) {
		const cleanup = simulateSuffixUnitCleanup(sourceUnit, allConversions, allUnits);
		conversionsToRemove.push(...cleanup.conversionsToRemove);
	}

	if (isSuffixRelated(destUnit)) {
		const cleanup = simulateSuffixUnitCleanup(destUnit, allConversions, allUnits);
		conversionsToRemove.push(...cleanup.conversionsToRemove);
	}
	
	// Remove duplicates (in case both source and dest are suffix units and share conversions)
	const uniqueConversionsToRemove = Array.from(
		new Map(conversionsToRemove.map(c => [`${c.sourceId}-${c.destinationId}`, c])).values()
	);
	
	// 4. Remove all affected conversions from the simulation
	const newConversions = allConversions.filter(c => {
		return !uniqueConversionsToRemove.some(toRemove =>
			c.sourceId === toRemove.sourceId && c.destinationId === toRemove.destinationId
		);
	});

	// 5. Build simulated graph and Cik array
	const simulatedGraph = createConversionGraphFromArray(allUnits, newConversions);
	const simulatedCik = await createCikArray(simulatedGraph, conn);

	// 6. Get the current Cik array
	const currentGraph = await createConversionGraph(conn);
	const currentCik = await createCikArray(currentGraph, conn);

	// 7. Precompute compatible units for each meter (current and simulated)
	const meterIdToUnitsCurrent = {};
	const meterIdToUnitsSim = {};
	for (const meter of allMeters) {
		meterIdToUnitsCurrent[meter.id] = compatibleUnitsForMeter(meter.unitId, currentCik);
		meterIdToUnitsSim[meter.id] = compatibleUnitsForMeter(meter.unitId, simulatedCik);
	}

	// 8. Batch load all group-to-meter relationships
	const groupIdToMeterIds = {};
	await Promise.all(allGroups.map(async group => {
		groupIdToMeterIds[group.id] = await Group.getDeepMetersByGroupID(group.id, conn);
	}));

	// 9. For each meter, compare compatible units before/after
	const affectedMeters = [];
	for (const meter of allMeters) {
		const before = meterIdToUnitsCurrent[meter.id] || new Set();
		const after = meterIdToUnitsSim[meter.id] || new Set();
		const lostUnits = [...before].filter(u => !after.has(u));
		if (lostUnits.length > 0) {
			affectedMeters.push({
				meterId: meter.id,
				meterName: meter.name,
				lostUnits
			});
		}
	}

	// 10. For each group, intersect the sets (using cached meter compatible units)
	const affectedGroups = [];
	for (const group of allGroups) {
		const meterIds = groupIdToMeterIds[group.id];
		if (meterIds && meterIds.length > 0) {
			const setsCurrent = meterIds.map(id => meterIdToUnitsCurrent[id] || new Set());
			const setsSim = meterIds.map(id => meterIdToUnitsSim[id] || new Set());
			const before = setsCurrent.length ? intersectSets(setsCurrent) : new Set();
			const after = setsSim.length ? intersectSets(setsSim) : new Set();

			const lostUnits = [...before].filter(u => !after.has(u));
			if (lostUnits.length > 0) {
				affectedGroups.push({
					groupId: group.id,
					groupName: group.name,
					lostUnits,
					orphaned: after.size === 0
				});
			}
		}
	}

	return { affectedMeters, affectedGroups };
}

module.exports = { simulateDeleteConversion };
