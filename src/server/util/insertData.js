/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Unit = require('../models/Unit');
const Conversion = require('../models/Conversion');
const Meter = require('../models/Meter');
const Group = require('../models/Group');
const { loadCsvInput } = require('../services/pipeline-in-progress/loadCsvInput');
const moment = require('moment');
const fs = require('fs').promises;

/**
 * Inserts specified units into the database.
 * @param [[]] unitsToInsert array of arrays where each row specifies a unit with items:
 * name, identifier, unitRepresentType, secInRate, typeOfUnit, suffix, displayable, preferredDisplay, note.
 * @param {*} conn database connection to use.
 */
async function insertUnits(unitsToInsert, conn) {
	await Promise.all(unitsToInsert.map(
		async unitData => {
			if (await Unit.getByName(unitData[0], conn) === null) {
				await new Unit(undefined, unitData[0], unitData[1], unitData[2], unitData[3],
					unitData[4], null, unitData[5], unitData[6], unitData[7], unitData[8]).insert(conn);
			}
		}
	));
}

/**
 * Inserts standard units to the database.
 * @param {*} conn database connection to use.
 */
async function insertStandardUnits(conn) {
	// The table contains units' data. 
	const standardUnits = [
		['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'OED created standard unit'],
		['MJ', 'megaJoules', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, false, 'OED created standard unit'],
		['BTU', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'OED created standard unit'],
		['m³ gas', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, false, 'OED created standard unit'],
		['kg', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, false, 'OED created standard unit'],
		['metric ton', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, false, 'OED created standard unit'],
		['Fahrenheit', '', Unit.unitRepresentType.RAW, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, false, 'OED created standard unit'],
		['Celsius', '', Unit.unitRepresentType.RAW, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, false, 'OED created standard unit']
	];

	await insertUnits(standardUnits, conn);
}

/**
 * Insert specified conversions into the database.
 * @param [[]] conversionsToInsert array of arrays where each row specifies a unit with items:
 * source unit name, destination unit name, bidirectional, slope, intercept, note.
 * @param {*} conn database connection to use.
 */
async function insertConversions(conversionsToInsert, conn) {
	await Promise.all(conversionsToInsert.map(
		async conversionData => {
			const sourceId = (await Unit.getByName(conversionData[0], conn)).id;
			const destinationId = (await Unit.getByName(conversionData[1], conn)).id;
			if (await Conversion.getBySourceDestination(sourceId, destinationId, conn) === null) {
				await new Conversion(sourceId, destinationId, conversionData[2], conversionData[3], conversionData[4], conversionData[5]).insert(conn);
			}
		}
	));
}

/**
 * Inserts standard conversions.
 * @param {*} conn The connection to use.
 */
async function insertStandardConversions(conn) {
	// The table contains standard conversions' data.
	const standardConversions = [
		['kWh', 'MJ', true, 3.6, 0, 'kWh → MJ'],
		['MJ', 'm³ gas', true, 2.6e-2, 0, 'MJ → m^3 gas'],
		['MJ', 'BTU', true, 947.8, 0, 'MJ → BTU'],
		['kg', 'metric ton', true, 1e-3, 0, 'kg → Metric ton'],
		['Celsius', 'Fahrenheit', true, 1.8, 32, 'Celsius → Fahrenheit']
	];

	// await Conversion.insertMany(standardConversions, conn);
	await insertConversions(standardConversions, conn);
}

/**
 * Inserts meters specified into the database and adds readings from CSV file.
 * @param [[]] metersToInsert array of arrays that specify the meter info for inserting meters where each row has
 * meter name, unit name, default graphic unit name, displayable, gps, note, CSV reading data filename, whether to delete csv file, meter id.
 * A final [6] item in row can be the value to set the meter id to.
 * @param {*} conn database connection
 */
async function insertMeters(metersToInsert, conn) {
	// Function used to map values when reading the CSV file.
	function mapRowsToModel(row) {
		const reading = row[0];
		// Need to work in UTC time since that is what the database returns and comparing
		// to database values. Done in all moment objects in this test.
		// const startTimestamp = moment.utc(row[1], 'HH:mm:ss MM/DD/YYYY');
		const startTimestamp = moment.utc(row[1], true);
		const endTimestamp = moment.utc(row[2], true);
		return [reading, startTimestamp, endTimestamp];
	}

	// This does not use Promise.all as units and conversions for two reasons. The primary one is that the current
	// loading of data for meters from CSV files requires a lot of memory. Running them in parallel often causes
	// the JS VM to run out of heap memeory if you load lots of meters with large CSV file as is done at times.
	// Given this only slows down the process for developers and is not done too often, this seems okay.
	// If we ever directly create the meter data instead of load via files then this should go away. 
	// Second, the messages about changing the meter id do not align with the first meter message.
	// This could be fixed in several ways but not doing because not using now.
	for (let i = 0; i < metersToInsert.length; ++i) {
		// Meter values from above.
		const meterData = metersToInsert[i];
		const meterName = meterData[0];
		console.log(`    loading meter ${meterName} from file ${meterData[6]}`);
		// We get the needed unit id from the name given.
		let meterUnit, meterGraphicUnit;
		if (meterData[1] === '') {
			// No unit so make it -99 for both unit and default graphic unit
			meterUnit = -99;
			meterGraphicUnit = -99;
		} else {
			meterUnit = (await Unit.getByName(meterData[1], conn)).id;
			meterGraphicUnit = (await Unit.getByName(meterData[2], conn)).id;
		}
		const meter = new Meter(
			undefined, // id
			meterName, // name
			null, // URL
			false, // enabled
			meterData[3], //displayable
			'other', //type
			null, // timezone
			meterData[4], // gps
			undefined, // identifier
			meterData[5], // note
			null, //area
			undefined, // cumulative
			undefined, //cumulativeReset
			undefined, // cumulativeResetStart
			undefined, // cumulativeResetEnd
			90000, // readingGap
			90000, // readingVariation
			undefined, //readingDuplication
			undefined, // timeSort
			undefined, //endOnlyTime
			undefined, // reading
			undefined, // startTimestamp
			undefined, // endTimestamp
			undefined, // previousEnd
			meterUnit, // unit
			meterGraphicUnit // default graphic unit
		);
		const filename = `src/server/${meterData[6]}`;
		if (await meter.existsByName(conn)) {
			console.log(`        Warning: meter '${meter.name}' existed so not changed.`);
		} else {
			// Only insert the meter and its readings if the meter did not already exist.
			await meter.insert(conn);
			// If meterData[8] is not undefined then use value to set meter id.
			// This is normally only done for the website data.
			// It is best/easiest to do this before there is any readings for this meter or used in a group.
			const newId = meterData[8];
			if (newId != undefined) {
				console.log('        meter id set to ', newId);
				meter.id = newId;
				const query = `update meters set id = ${meter.id} where name = '${meterName}'`;
				await conn.none(query);
			}
			await loadCsvInput(
				filename, // filePath
				meter.id, // meterID
				mapRowsToModel, // mapRowToModel
				meter.timeSort, //timeSort
				meter.readingDuplication, //readingRepetition
				meter.cumulative, // isCumulative
				meter.cumulativeReset, // cumulativeReset
				meter.cumulativeResetStart, // cumulativeResetStart
				meter.cumulativeResetEnd, // cumulativeResetEnd
				meter.readingGap, // readingGap
				meter.readingVariation, // readingLengthVariation
				meter.endOnlyTime, // isEndOnly
				true, // headerRow
				false, // shouldUpdate
				undefined, // conditionSet
				conn
			);
		}
		// Delete mathematical test data file just uploaded. They have true for delete.
		// Try to delete even if not uploaded since created anyway.
		if (meterData[7] === true) {
			await fs.unlink(filename);
		}
	}
}

/**
 * Inserts groups specified into the database.
 * @param [[]] groupsToInsert array of arrays that specify the group info for inserting groups where each row has:
 * group name, default graphic unit name, displayable, gps, note, array of meter names to add to group, array of group names to add to group, group id.
 * A final [5] optional item in row can be the value to set the meter id to.
 * @param {*} conn database connection
 */
async function insertGroups(groupsToInsert, conn) {
	// We don't use Promise.all since one group may include another group.
	for (let i = 0; i < groupsToInsert.length; ++i) {
		// Group values from above.
		const groupData = groupsToInsert[i];
		const groupName = groupData[0];
		console.log(`    creating group ${groupName}`);
		// We get the needed unit id from the name given.
		let groupDefaultGraphicUnit;
		if (groupData[1] === '') {
			// No unit so make it -99.
			groupDefaultGraphicUnit = -99;
		} else {
			groupDefaultGraphicUnit = (await Unit.getByName(groupData[1], conn)).id;
		}
		const group = new Group(
			undefined, // id
			groupName, // name
			groupData[2], //displayable
			groupData[3], // gps
			groupData[4], // note
			null, //area
			groupDefaultGraphicUnit // default graphic unit
		);
		if (await group.existsByName(conn)) {
			console.log(`        Warning: group '${group.name}' existed so not changed.`);
		} else {
			// Only insert the group and its children if the group did not already exist.
			await group.insert(conn);
			// If meterData[7] is not undefined then use value to set meter id.
			// This is normally only done for the website data.
			// It is best/easiest to do this before there are any members of the group.
			const newId = groupData[7];
			let parent;
			if (newId != undefined) {
				console.log('         group id set to ', newId);
				group.id = newId;
				const query = `update groups set id = ${group.id} where name = '${groupName}'`;
				await conn.none(query);
				parent = group;
			} else {
				// Get it again so have id.
				parent = await Group.getByName(group.name, conn);
			}
			// Now add the meter children.
			for (let k = 0; k < groupData[5].length; ++k) {
				const childMeter = groupData[5][k];
				console.log(`        adding child meter ${childMeter}`);
				// Use meter id to add to group.
				const childId = (await Meter.getByName(childMeter, conn)).id;
				await parent.adoptMeter(childId, conn);
			}
			// Now add the group children.
			for (let k = 0; k < groupData[6].length; ++k) {
				const childGroup = groupData[6][k];
				console.log(`        adding child group ${childGroup}`);
				// Use group id to add to group.
				const childId = (await Group.getByName(childGroup, conn)).id;
				await parent.adoptGroup(childId, conn);
			}
		}
	}
}

module.exports = {
	insertUnits,
	insertStandardUnits,
	insertConversions,
	insertStandardConversions,
	insertMeters,
	insertGroups
};
