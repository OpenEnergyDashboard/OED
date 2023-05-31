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
 * This inserts meters into the database. The meters are defined in the array metersToInsert
 * where each entry is a JS object of key: value pairs. The keys can be any field of a meter,
 * e.g., id, name, ..., readingFrequency. All fields are optional (except as
 * noted next) where they will get the default value if not provided except those below.
 * Other allowed fields are also given.
 * 
 * name is required with no default
 * 
 * file is required with no default (not meter value) where it specifies the file to get
 * 
 * deleteFile will delete the file with meter readings (file) if true (not meter value).
 * If not provided then file is not deleted.
 * 
 * enabled has false as default
 * 
 * displayable has false as default
 * 
 * type has 'other' as default
 * 
 * readingGap has 90000 as default so normally won't get warnings
 * 
 * readingVariation has 90000 as default so normally won't get warnings
 * 
 * Note the values provided for the keys are not checked for validity.
 * @param {[{}]} metersToInsert key:value pairs of meter values in array with entry for each meter
 * @param {*} conn database connection to use
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

	// Loop over all meters.
	for (let i = 0; i < metersToInsert.length; ++i) {
		// Meter key/value pairs for the current meter.
		const meterData = metersToInsert[i];

		// Check that needed keys are there.
		const requiredKeys = ['name', 'file'];
		let ok = true;
		requiredKeys.forEach(key => {
			if (!meterData[key]) {
				// Note 
				console.log(`********key "${key}" is required but missing so meter number ${i} not processed`);
				ok = false;
			}
		})

		if (ok) {
			console.log(`    loading meter ${meterData.name} from file ${meterData.file}`);
			// Get the unit by name if provided or -99 if not
			meterData.unit = meterData.unit ? (await Unit.getByName(meterData.unit, conn)).id : -99;
			meterData.defaultGraphicUnit = meterData.defaultGraphicUnit ? (await Unit.getByName(meterData.defaultGraphicUnit, conn)).id : -99;
			// enabled and displayable are false by default.
			meterData.enabled = meterData.enabled ? meterData.enabled : false;
			meterData.displayable = meterData.displayable ? meterData.displayable : false;
			// type is other by default
			meterData.type = meterData.type ? meterData.type : 'other';
			// The gap and variation are set large by default to avoid complaints
			meterData.readingGap = 90000;
			meterData.readingVariation = 90000;

			const meter = new Meter(
				undefined, // id
				meterData.name,
				meterData.url,
				meterData.enabled,
				meterData.displayable,
				meterData.type,
				meterData.meterTimezone,
				meterData.gps,
				meterData.identifier,
				meterData.note,
				meterData.area,
				meterData.cumulative,
				meterData.cumulativeReset,
				meterData.cumulativeResetStart,
				meterData.cumulativeResetEnd,
				meterData.readingGap,
				meterData.readingVariation,
				meterData.readingDuplication,
				meterData.timeSort,
				meterData.endOnlyTime,
				meterData.reading,
				meterData.startTimestamp,
				meterData.endTimestamp,
				meterData.previousEnd,
				meterData.unit,
				meterData.defaultGraphicUnit,
				meterData.areaUnit,
				meterData.readingFrequency
			);

			// This does not use Promise.all as units and conversions for two reasons. The primary one is that the current
			// loading of data for meters from CSV files requires a lot of memory. Running them in parallel often causes
			// the JS VM to run out of heap memory if you load lots of meters with large CSV file as is done at times.
			// Given this only slows down the process for developers and is not done too often, this seems okay.
			// If we ever directly create the meter data instead of load via files then this should go away. 
			// Second, the messages about changing the meter id do not align with the first meter message.
			// This could be fixed in several ways but not doing because not using now.

			let filename = `src/server/${meterData.file}`;
			if (await meter.existsByName(conn)) {
				console.log(`        Warning: meter '${meter.name}' existed so not changed.`);
			} else {
				// Only insert the meter and its readings if the meter did not already exist.
				await meter.insert(conn);
				// If meterData.id is not undefined then use value to set meter id.
				// This is normally only done for the website data.
				// It is best/easiest to do this before there is any readings for this meter or used in a group.
				if (meterData.id) {
					console.log('        meter id set to ', meterData.id);
					meter.id = meterData.id;
					const query = `update meters set id = ${meterData.id} where name = '${meter.name}'`;
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
			if (meterData.deleteFile) {
				// TODO Unsure why this check for the file existing does not work.
				// Only delete if it exists.
				// fs.access(filename, constants.F_OK, async err => {
				// 	if (!err) {
				// 		await fs.unlink(filename)
				// 	}
				// });
				await fs.unlink(filename);
			}
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
			undefined, //area
			groupDefaultGraphicUnit, // default graphic unit
			undefined // area unit
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
