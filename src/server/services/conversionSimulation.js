/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { createCikArray } = require('./graph/createConversionArrays');
const Conversion = require('../models/Conversion');
const Meter = require('../models/Meter');
const Group = require('../models/Group');
const Unit = require('../models/Unit');
const { createConversionGraph, createConversionGraphFromArray } = require('./graph/createConversionGraph');

async function simulateDeleteConversion({ sourceId, destinationId }, conn) {

	// 1. Load all data
	const [allConversions, allMeters, allUnits, allGroups] = await Promise.all([
		Conversion.getAll(conn),
		Meter.getAll(conn),
		Unit.getAll(conn),
		Group.getAll(conn)
	]);

	// 2. Remove the conversion to be deleted
	const newConversions = allConversions.filter(c =>
		!(c.sourceId === sourceId && c.destinationId === destinationId)
	);

	// 3. Build simulated graph and Cik array
	const simulatedGraph = createConversionGraphFromArray(allUnits, newConversions);
	const simulatedCik = await createCikArray(simulatedGraph, conn);

	// 4. Get the current Cik array
	const currentGraph = await createConversionGraph(conn);
	const currentCik = await createCikArray(currentGraph, conn);

	// 5. Precompute compatible units for each meter (current and simulated)
	const meterIdToUnitsCurrent = {};
	const meterIdToUnitsSim = {};
	for (const meter of allMeters) {
		if (meter.unitId == -99) {
			meterIdToUnitsCurrent[meter.id] = new Set();
			meterIdToUnitsSim[meter.id] = new Set();
			continue;
		}
		meterIdToUnitsCurrent[meter.id] = new Set(currentCik.filter(cik => cik.source === meter.unitId).map(cik => cik.destination));
		meterIdToUnitsSim[meter.id] = new Set(simulatedCik.filter(cik => cik.source === meter.unitId).map(cik => cik.destination));
	}

	// 6. Batch load all group-to-meter relationships
	const groupIdToMeterIds = {};
	await Promise.all(allGroups.map(async group => {
		groupIdToMeterIds[group.id] = await Group.getDeepMetersByGroupID(group.id, conn);
	}));

	// 7. For each meter, compare compatible units before/after
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

	// 8. For each group, intersect the sets (using cached meter compatible units)
	const affectedGroups = [];
	for (const group of allGroups) {
		const meterIds = groupIdToMeterIds[group.id];
		if (!meterIds || meterIds.length === 0) {
			continue;
		}
		const intersectSets = sets => sets.reduce((a, b) => new Set([...a].filter(x => b.has(x))));
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

	return { affectedMeters, affectedGroups };
}

module.exports = { simulateDeleteConversion };
