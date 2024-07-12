/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Unit = require('../models/Unit');
const Conversion = require('../models/Conversion');
const Meter = require('../models/Meter');
const Group = require('../models/Group');
const { loadCsvInput } = require('../services/pipeline-in-progress/loadCsvInput');
const { loadGeneratedInput } = require('../services/pipeline-in-progress/loadGeneratedInput');
const moment = require('moment');
const fs = require('fs').promises;
const cloneDeep = require('lodash/cloneDeep');

/**
 * Inserts specified units into the database.
 * @param [[]] unitsToInsert array of arrays where each row specifies a unit with items:
 * name, identifier, unitRepresentType, secInRate, typeOfUnit, suffix, displayable, preferredDisplay, note.
 * @param {boolean} update true if should update unit if it exists, false by default
 * @param {*} conn database connection to use.
 */
async function insertUnits(unitsToInsert, update = false, conn) {
	await Promise.all(unitsToInsert.map(
		async (unitData, index) => {
			// Check that needed keys are there.
			const requiredKeys = ['name', 'unitRepresent', 'typeOfUnit', 'displayable', 'preferredDisplay'];
			let ok = true;
			requiredKeys.forEach(key => {
				if (!unitData.hasOwnProperty(key)) {
					console.log(`********key "${key}" is required but missing so unit number ${index} not processed with values:`, unitData);
					// Don't insert
					ok = false;
				}
			})
			if (ok) {
				const dbUnit = await Unit.getByName(unitData.name, conn);
				if (dbUnit === null) {
					// The unit does not exist so add it.
					await new Unit(undefined, unitData.name, unitData.identifier, unitData.unitRepresent, unitData.secInRate,
						unitData.typeOfUnit, unitData.suffix, unitData.displayable, unitData.preferredDisplay, unitData.note).insert(conn);
				} else if (update) {
					// Asked to update so will. Does not bother to check if no changes.
					dbUnit.name = unitData.name;
					dbUnit.identifier = unitData.identifier;
					dbUnit.unitRepresent = unitData.unitRepresent;
					dbUnit.secInRate = unitData.secInRate;
					dbUnit.typeOfUnit = unitData.typeOfUnit;
					dbUnit.suffix = unitData.suffix;
					dbUnit.displayable = unitData.displayable;
					dbUnit.preferredDisplay = unitData.preferredDisplay;
					dbUnit.note = unitData.note;
					// Should update even though exists.
					await dbUnit.update(conn);
				}
				// Otherwise do not update.
			}
		}
	))
}

/**
 * Inserts standard units to the database.
 * @param {*} conn database connection to use.
 */
async function insertStandardUnits(conn) {
	// The table contains units' data. 
	const standardUnits = [
		{
			name: 'kWh',
			identifier: '',
			unitRepresent: Unit.unitRepresentType.QUANTITY,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.UNIT,
			suffix: '',
			displayable: Unit.displayableType.ALL,
			preferredDisplay: true,
			note: 'OED created standard unit'
		},
		{
			name: 'BTU',
			identifier: '',
			unitRepresent: Unit.unitRepresentType.QUANTITY,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.UNIT,
			suffix: '',
			displayable: Unit.displayableType.NONE,
			preferredDisplay: true,
			note: 'OED created standard unit'
		},
		{
			name: 'm³ gas',
			identifier: '',
			unitRepresent: Unit.unitRepresentType.QUANTITY,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.UNIT,
			suffix: '',
			displayable: Unit.displayableType.NONE,
			preferredDisplay: false,
			note: 'OED created standard unit'
		},
		{
			name: 'kg',
			identifier: '',
			unitRepresent: Unit.unitRepresentType.QUANTITY,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.UNIT,
			suffix: '',
			displayable: Unit.displayableType.NONE,
			preferredDisplay: false,
			note: 'OED created standard unit'
		},
		{
			name: 'metric ton',
			identifier: '',
			unitRepresent: Unit.unitRepresentType.QUANTITY,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.UNIT,
			suffix: '',
			displayable: Unit.displayableType.NONE,
			preferredDisplay: false,
			note: 'OED created standard unit'
		},
		{
			name: 'gallon',
			identifier: '',
			unitRepresent: Unit.unitRepresentType.QUANTITY,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.UNIT,
			suffix: '',
			displayable: Unit.displayableType.NONE,
			preferredDisplay: true,
			note: 'OED created standard unit'
		},
		{
			name: 'liter',
			identifier: '',
			unitRepresent: Unit.unitRepresentType.QUANTITY,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.UNIT,
			suffix: '',
			displayable: Unit.displayableType.NONE,
			preferredDisplay: true,
			note: 'OED created standard unit'
		},
		{
			name: 'Fahrenheit',
			identifier: '',
			unitRepresent: Unit.unitRepresentType.RAW,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.UNIT,
			suffix: '',
			displayable: Unit.displayableType.NONE,
			preferredDisplay: false,
			note: 'OED created standard unit'
		},
		{
			name: 'Celsius',
			identifier: '',
			unitRepresent: Unit.unitRepresentType.RAW,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.UNIT,
			suffix: '',
			displayable: Unit.displayableType.NONE,
			preferredDisplay: false,
			note: 'OED created standard unit'
		},
		{
			name: 'Electric_Utility',
			identifier: '',
			unitRepresent: Unit.unitRepresentType.QUANTITY,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.METER,
			suffix: '',
			displayable: Unit.displayableType.NONE,
			preferredDisplay: false,
			note: 'OED created meter unit'
		},
	];

	await insertUnits(standardUnits, false, conn);
}

/**
 * Insert specified conversions into the database.
 * @param [[]] conversionsToInsert array of arrays where each row specifies a unit with items:
 * source unit name, destination unit name, bidirectional, slope, intercept, note.
 * @param {*} conn database connection to use.
 */
async function insertConversions(conversionsToInsert, conn) {
	await Promise.all(conversionsToInsert.map(
		async (conversionData, index) => {
			// Check that needed keys are there.
			const requiredKeys = ['sourceName', 'destinationName', 'bidirectional', 'slope', 'intercept'];
			let ok = true;
			requiredKeys.forEach(key => {
				if (!conversionData.hasOwnProperty(key)) {
					console.log(`********key "${key}" is required but missing so conversion number ${index} not processed with values:`, conversionData);
					// Don't insert
					ok = false;
				}
			})
			if (ok) {
				const sourceName = (await Unit.getByName(conversionData.sourceName, conn)).id;
				const destinationName = (await Unit.getByName(conversionData.destinationName, conn)).id;
				if (await Conversion.getBySourceDestination(sourceName, destinationName, conn) === null) {
					await new Conversion(sourceName, destinationName, conversionData.bidirectional, conversionData.slope, conversionData.intercept, conversionData.note).insert(conn);
				}
			}
		}
	))
}

/**
 * Inserts standard conversions.
 * @param {*} conn The connection to use.
 */
async function insertStandardConversions(conn) {
	// The table contains standard conversions' data.
	const standardConversions = [
		{
			sourceName: 'kWh',
			destinationName: 'BTU',
			bidirectional: true,
			slope: 3412.142,
			intercept: 0,
			note: 'OED created kWh → BTU'
		},
		{
			sourceName: 'BTU',
			destinationName: 'm³ gas',
			bidirectional: true,
			slope: 2.73e-5,
			intercept: 0,
			note: 'OED created BTU → m³ gas (average U.S. for 2021 according to U.S. E.I.A)'
		},
		{
			sourceName: 'kg',
			destinationName: 'metric ton',
			bidirectional: true,
			slope: 1e-3,
			intercept: 0,
			note: 'OED created kg → Metric ton'
		},
		{
			sourceName: 'liter',
			destinationName: 'gallon',
			bidirectional: true,
			slope: 0.2641729,
			intercept: 0,
			note: 'OED created liter → gallon'
		},
		{
			sourceName: 'Celsius',
			destinationName: 'Fahrenheit',
			bidirectional: true,
			slope: 1.8,
			intercept: 32,
			note: 'OED created Celsius → Fahrenheit'
		},
		{
			sourceName: 'Electric_Utility',
			destinationName: 'kWh',
			bidirectional: false,
			slope: 1,
			intercept: 0,
			note: 'OED created  for meters Electric_Utility → kWh'
		}
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
 * @returns Promise for all meters/data inserted into DB.
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

	// Formats the data if it is generated rather than coming from a file
	function mapGeneratedData(row) {
		const value = row.value;
		const startTimeStamp = moment.utc(row.startTimeStamp, true);
		const endTimeStamp = moment.utc(row.endTimeStamp, true);
		return [value, startTimeStamp, endTimeStamp];
	}

	// Array that holds the promise from inserting data into DB or not doing for each meter.
	let resultPromise = [];
	// Loop over all meters.
	for (let i = 0; i < metersToInsert.length; ++i) {
		// Meter key/value pairs for the current meter.
		// Since potentially change the values of the key/value pairs, clone it. The Lodash clone is probably overkill but okay.
		const meterData = cloneDeep(metersToInsert[i]);

		// Check that needed keys are there.
		//Make file an optional key
		const requiredKeys = ['name'];
		let ok = true;
		requiredKeys.forEach(key => {
			if (!meterData[key]) {
				// Note 
				console.log(`********key "${key}" is required but missing so meter number ${i} not processed`);
				ok = false;
			}
		})
		if (ok) {
			if (meterData.file && meterData.data) {
				// If there is both a file and data throw and error since there can't be both
				console.log('Error: Both file and data cannot be provided.');
				ok = false;
			} else if (!meterData.file && !meterData.data) {
				// If there isn't a file or data throw an error since at least one is needed
				console.log('Error: Either a file or data must be provided.');
				ok = false;
			}
		}
		if (ok) {
			console.log(`            loading meter ${meterData.name}`);
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
				meterData.readingFrequency,
				meterData.minVal,
				meterData.maxVal,
				meterData.minDate,
				meterData.maxDate,
				meterData.maxError,
				meterData.disableChecks
			);

			// This does not use Promise.all as units and conversions for two reasons. The primary one is that the current
			// loading of data for meters from CSV files requires a lot of memory. Running them in parallel often causes
			// the JS VM to run out of heap memory if you load lots of meters with large CSV file as is done at times.
			// Given this only slows down the process for developers and is not done too often, this seems okay.
			// If we ever directly create the meter data instead of load via files then this should go away. 
			// Second, the messages about changing the meter id do not align with the first meter message.
			// This could be fixed in several ways but not doing because not using now.

			if (await meter.existsByName(conn)) {
				console.log(`              Warning: meter '${meter.name}' existed so not changed.`);
				resultPromise.push(new Promise((resolve) => {
					resolve('meter ' + i + ' existed');
				}));
			} else {
				// Only insert the meter and its readings if the meter did not already exist.
				await meter.insert(conn);
				// If meterData.id is not undefined then use value to set meter id.
				// This is normally only done for the website data.
				// It is best/easiest to do this before there is any readings for this meter or used in a group.
				if (meterData.id) {
					console.log('              meter id set to ', meterData.id);
					meter.id = meterData.id;
					const query = `update meters set id = ${meterData.id} where name = '${meter.name}'`;
					await conn.none(query);
				}
				const conditionSet = {
					minVal: meter.minVal,
					maxVal: meter.maxVal,
					minDate: meter.minDate,
					maxDate: meter.maxDate,
					threshold: meter.readingGap,
					maxError: meter.maxError,
					disableChecks: meter.disableChecks
				}
				if (meterData.file) {
					// load data from file
					console.log(`              getting meter data from file ${meterData.file}`);
					let filename = `src/server/${meterData.file}`;
					resultPromise.push(loadCsvInput(
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
						conditionSet, // conditionSet
						conn,
						meter.honorDst,
						meter.relaxedParsing,
						meter.useMeterZone
					));
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
				} else {
					// TODO make into if/else: new mapping function and add else for error
					// Create loadGeneratedInput and call it here   
					// Pass a new variable like meter.data instead of file name, data that needs to map, function uses that data 
					// Otherwise if there is no file, load data from variable
					resultPromise.push(loadGeneratedInput(
						meterData.data, // generated data
						meter.id, // meterID
						mapGeneratedData, // mapGeneratedData
						meter.timeSort, //timeSort
						meter.readingDuplication, //readingRepetition
						meter.cumulative, // isCumulative
						meter.cumulativeReset, // cumulativeReset
						meter.cumulativeResetStart, // cumulativeResetStart
						meter.cumulativeResetEnd, // cumulativeResetEnd
						meter.readingGap, // readingGap
						meter.readingVariation, // readingLengthVariation
						meter.endOnlyTime, // isEndOnly
						false, // shouldUpdate
						conditionSet, // conditionSet
						conn
					));
				}
			}
		}
	}
	return Promise.all(resultPromise);
}

/**
 * Inserts groups specified into the database.
 * @param [[]] groupsToInsert array of arrays that specify the group info for inserting groups where each row has:
 * group name, default graphic unit name, displayable, gps, note, array of meter names to add to group, array of group names to add to group, group id.
 * A final [5] optional item in row can be the value to set the meter id to.
 * @param {*} conn database connection
 */
async function insertGroups(groupsToInsert, conn) {
	// Check that needed keys are there.
	const requiredKeys = ['name', 'displayable', 'childMeters', 'childGroups'];
	// We don't use Promise.all since one group may include another group.
	// Loop over the array of groups provided.
	for (let i = 0; i < groupsToInsert.length; ++i) {
		// Group currently working on
		const groupData = groupsToInsert[i];
		// Check that all required keys are present for this group.
		let ok = true;
		requiredKeys.forEach(key => {
			if (!groupData.hasOwnProperty(key)) {
				console.log(`********key "${key}" is required but missing so group number ${i} not processed with values:`, groupData);
				// Don't insert
				ok = false;
			}
		})
		if (ok) {
			// Group values from above.
			const groupName = groupData.name;
			console.log(`            creating group ${groupName}`);
			// We get the needed unit id from the name given of the default graphic unit.
			let groupDefaultGraphicUnit;
			if (groupData.hasOwnProperty('defaultGraphicUnit')) {
				// This group provided a default graphic unit name so use to get the existing unit id.
				// This simply fails if the name does not exist since this is special code and not for users.
				groupDefaultGraphicUnit = (await Unit.getByName(groupData.defaultGraphicUnit, conn)).id;
			} else {
				// No unit so make it -99, i.e., no unit.
				groupDefaultGraphicUnit = -99;
			}
			const group = new Group(
				undefined, // id
				groupName,
				groupData.displayable,
				groupData.gps,
				groupData.note,
				groupData.area,
				groupDefaultGraphicUnit,
				groupData.areaUnit
			);
			if (await group.existsByName(conn)) {
				console.log(`              Warning: group '${group.name}' existed so not changed.`);
			} else {
				// Only insert the group and its children if the group did not already exist.
				await group.insert(conn);
				// If id is not undefined then use value to set meter id.
				// This is normally only done for the website data.
				// It is best/easiest to do this before there are any members of the group.
				let parent;
				if (groupData.hasOwnProperty('id')) {
					// Get it again so have id.
					const newId = groupData.id;
					console.log('              group id set to ', newId);
					group.id = newId;
					const query = `update groups set id = ${group.id} where name = '${groupName}'`;
					await conn.none(query);
					parent = group;
				} else {
					// Set to id provided.
					parent = await Group.getByName(group.name, conn);
				}
				// Now add the meter children.
				for (let k = 0; k < groupData.childMeters.length; ++k) {
					const childMeter = groupData.childMeters[k];
					console.log(`              adding child meter ${childMeter}`);
					// Use meter id to add to group.
					const childId = (await Meter.getByName(childMeter, conn)).id;
					await parent.adoptMeter(childId, conn);
				}
				// Now add the group children.
				for (let k = 0; k < groupData.childGroups.length; ++k) {
					const childGroup = groupData.childGroups[k];
					console.log(`              adding child group ${childGroup}`);
					// Use group id to add to group.
					const childId = (await Group.getByName(childGroup, conn)).id;
					await parent.adoptGroup(childId, conn);
				}
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
