/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This file creates the data and puts it in the DB for the OED website.
 * The needed CSV files with the meter data are not included in the OED
 * distribution to save disk space. They are available in the devDocs
 * for developers.
 */

const Unit = require('../models/Unit');
const { redoCik } = require('../services/graph/redoCik');
const { refreshAllReadingViews } = require('../services/refreshAllReadingViews');
const { getConnection } = require('../db');
const { insertUnits, insertStandardUnits, insertConversions, insertStandardConversions, insertMeters, insertGroups } = require('../util/insertData');
const { shiftReadings } = require('../util/developer');
/*
If you want to remove all the data and restart from fresh you can do this in the psql shell:
delete from readings; delete from groups_immediate_meters; delete from groups_immediate_children; delete from groups; delete from meters; delete from conversions; delete from units;
You then do 'npm run webData' in a shell on the OED web container.
*/

// These meters are the ones that are used for comparison and get two copies
// where one as an extra space at the end.
compareMeters = ['Dining Hall Electric', 'Theater Electric', 'Library Electric', 'Great Dorm 1st Floor Electric', 'Great Dorm 2nd Floor Electric']
// These groups are the ones that are used for comparison and get two copies
// where one as an extra space at the end.
compareGroups = ['Great Dorm Electric']

/**
 * Return the name with a space on the end.
 * @param {string} name string to use
 * @returns name + ' '
 */
function compareName(name) {
	// Add a space at the end of the name for a mirror comparison meter.
	return name + ' ';
}

/**
 * Return id that is a different number by same color of meter/group.
 * @param {*} id original id
 * @returns id shifted to new number but same color
 */
function compareId(id) {
	// Shift by a multiple of 47 because that gives the same color since it is mod 47 in getGraphicColor.
	// Do 5 of them so no chance will overlap with an id used by another meter.
	return id + 5 * 47;
}

/**
 * Call the functions to insert website units, conversions, meters and groups.
 */
async function insertWebsiteData() {
	// The table contains meters' data.
	const meters = [
		// The ids start at 10012 and increase by 1 for each meter because:
		// 1) it is a large value that should not conflict with normal usage.
		// 2) -This fixes each meter number to start at 10012 and increase by 1 for the next meter. The code in
		//  /Users/steve/OED/OED/src/client/app/utils/getGraphColor.ts subtracts 1 from the id and then does a modulo
		//  47 to get the color. 10012 gives 0 so starts in first index of the color array. Note groups start at the other
		//  end of the array so they use the same values.
		// Dining Hall Electric
		{
			name: compareMeters[0],
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: '-87.99913, 40.002',
			note: undefined,
			file: 'data/webData/DiningHallElectric.csv',
			deleteFile: false,
			id: 10012
		},

		// For comparison meters you get a new name & id and also make the displayable to be false.
		{
			name: compareName(compareMeters[0]),
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: false,
			gps: '-87.99913, 40.002',
			note: undefined,
			file: 'data/webData/DiningHallElectric.csv',
			deleteFile: false,
			id: compareId(10012)
		},
		{
			name: 'Dining Hall Gas',
			unit: 'Natural_Gas_BTU',
			defaultGraphicUnit: 'BTU',
			displayable: true,
			gps: '-87.99913, 40.002',
			note: undefined,
			file: 'data/webData/DiningHallGas.csv',
			deleteFile: false,
			id: 10013
		},
		{
			name: 'Dining Hall Water',
			unit: 'Water_Gallon',
			defaultGraphicUnit: 'gallon',
			displayable: true,
			gps: '-87.99913, 40.002',
			note: undefined,
			file: 'data/webData/DiningHallWater.csv',
			deleteFile: false,
			id: 10014
		},
		{
			name: 'Dining Hall Electric Power',
			unit: 'Electric_kW',
			defaultGraphicUnit: 'kW',
			displayable: true,
			gps: '-87.99913, 40.002',
			note: undefined,
			file: 'data/webData/DiningHallElectricPower.csv',
			deleteFile: false,
			id: 10015
		},
		// Theater Electric
		{
			name: compareMeters[1],
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: '-87.9975, 40.0027',
			note: undefined,
			file: 'data/webData/TheaterElectric.csv',
			deleteFile: false,
			id: 10016
		},
		{
			name: compareName(compareMeters[1]),
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: false,
			gps: '-87.9975, 40.0027',
			note: undefined,
			file: 'data/webData/TheaterElectric.csv',
			deleteFile: false,
			id: compareId(10016)
		},
		{
			name: 'Theater Gas',
			unit: 'Natural_Gas_M3',
			defaultGraphicUnit: 'BTU',
			displayable: true,
			gps: '-87.9975, 40.0027',
			note: undefined,
			file: 'data/webData/TheaterGas.csv',
			deleteFile: false,
			id: 10017
		},
		{
			name: 'Theater Electric Power',
			unit: 'Electric_kW',
			defaultGraphicUnit: 'kW',
			displayable: false,
			gps: '-87.9975, 40.0027',
			note: undefined,
			file: 'data/webData/TheaterElectricPower.csv',
			deleteFile: false,
			id: 10018
		},
		{
			name: 'Theater Temperature',
			unit: 'Temperature_Celsius',
			defaultGraphicUnit: 'Fahrenheit',
			displayable: true,
			gps: undefined,
			note: undefined,
			file: 'data/webData/TheaterTemperature.csv',
			deleteFile: false,
			id: 10019
		},
		// Library Electric
		{
			name: compareMeters[2],
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: '-87.99916, 40.00419',
			note: undefined,
			file: 'data/webData/LibraryElectric.csv',
			deleteFile: false,
			id: 10020
		},
		{
			name: compareName(compareMeters[2]),
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: false,
			gps: '-87.99916, 40.00419',
			note: undefined,
			file: 'data/webData/LibraryElectric.csv',
			deleteFile: false,
			id: compareId(10020)
		},
		{
			name: 'Library Temperature',
			unit: 'Temperature_Fahrenheit',
			defaultGraphicUnit: 'Fahrenheit',
			displayable: true,
			gps: undefined,
			note:  undefined,
			file: 'data/webData/LibraryTemperature.csv',
			deleteFile: false,
			id: 10021
		},
		// Great Dorm 1st Floor Electric
		{
			name: compareMeters[3],
			unit: 'Electric_Solar',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: '-87.99817, 40.00057',
			note: undefined,
			file: 'data/webData/GreatDorm1stFloorElectric.csv',
			deleteFile: false,
			id: 10022
		},
		{
			name: compareName(compareMeters[3]),
			unit: 'Electric_Solar',
			defaultGraphicUnit: 'kWh',
			displayable: false,
			gps: '-87.99817, 40.00057',
			note: undefined,
			file: 'data/webData/GreatDorm1stFloorElectric.csv',
			deleteFile: false,
			id: compareId(10022)
		},
		// Great Dorm 2nd Floor Electric
		{
			name: compareMeters[4],
			unit: 'Electric_Solar',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: '-87.99817, 40.00057',
			note: undefined,
			file: 'data/webData/GreatDorm2ndFloorElectric.csv',
			deleteFile: false,
			id: 10023
		},
		{
			name: compareName(compareMeters[4]),
			unit: 'Electric_Solar',
			defaultGraphicUnit: 'kWh',
			displayable: false,
			gps: '-87.99817, 40.00057',
			note: undefined,
			file: 'data/webData/GreatDorm2ndFloorElectric.csv',
			deleteFile: false,
			id: compareId(10023)
		},
		{
			name: 'Great Dorm Gas',
			unit: 'Natural_Gas_BTU',
			defaultGraphicUnit: 'BTU',
			displayable: true,
			gps: '-87.99817, 40.00057',
			note: undefined,
			file: 'data/webData/GreatDormGas.csv',
			deleteFile: false,
			id: 10024
		},
		{
			name: 'Great Dorm Water',
			unit: 'Water_Liter',
			defaultGraphicUnit: 'gallon',
			displayable: true,
			gps: '-87.99817, 40.00057',
			note: undefined,
			file: 'data/webData/GreatDormWater.csv',
			deleteFile: false,
			id: 10025
		},
		{
			name: 'Campus Recycling',
			unit: 'Recycling',
			defaultGraphicUnit: 'pound',
			displayable: true,
			gps: undefined,
			note:  undefined,
			file: 'data/webData/CampusRecycling.csv',
			deleteFile: false,
			id: 10026
		},
	];

	// The table contains groups' data.
	// The ids start at 10012 for similar reasons to meters but gives different colors
	// since it goes backward through the color array.
	const groups = [
		['Dining Hall Energy', 'kWh', true, '-87.99913, 40.002', 'Dining Hall Electric and Gas', ['Dining Hall Electric', 'Dining Hall Gas'], [], 10012],
		['Dining Hall All', 'short ton of CO₂', true, '-87.99913, 40.002', 'Dining Hall All', ['Dining Hall Water'], ['Dining Hall Energy'], 10013],
		['Theater Energy', 'kWh', true, ' -87.9975, 40.0027', 'Theater Electric and Gas', ['Theater Electric', 'Theater Gas'], [], 10014],
		['Theater All', 'short ton of CO₂', true, ' -87.9975, 40.0027', 'Theater All', [], ['Theater Energy'], 10015],
		['Dining & Theater Electric Power', 'kW', true, undefined, 'Dining & Theater Electric Power', ['Dining Hall Electric Power', 'Theater Electric Power'], [], 10016],
		['Library Electric', 'kWh', true, '-87.99916, 40.00419', 'Library Electric', ['Library Electric'], [], 10017],
		// Great Dorm Electric with 1st and 2nd floor Great Dorm Electric
		[compareGroups[0], 'kWh', true, '-87.99817, 40.00057', 'Great Dorm 1st & 2nd Electric', [compareMeters[3], compareMeters[4]], [], 10018],
		[compareName(compareGroups[0]), 'kWh', false, '-87.99817, 40.00057', 'Great Dorm 1st & 2nd Electric', [compareName(compareMeters[3]), compareName(compareMeters[4])], [], compareId(10018)],
		['Great Dorm Energy', 'kWh', true, '-87.99817, 40.00057', 'Great Dorm Electric and Gas', ['Great Dorm Gas'], ['Great Dorm Electric'], 10019],
		['Great Dorm All', 'short ton of CO₂', true, '-87.99817, 40.00057', 'Great Dorm All', ['Great Dorm Water'], ['Great Dorm Energy'], 10020],
		['Campus Electric', 'kWh', true, undefined, 'Campus Electric', ['Dining Hall Electric', 'Theater Electric', 'Library Electric'], ['Great Dorm Electric'], 10021],
		['Campus Gas', 'BTU', true, undefined, 'Campus Gas', ['Dining Hall Gas', 'Theater Gas', 'Great Dorm Gas'], [], 10022],
		['Campus Energy', 'kWh', true, undefined, 'Campus Energy', [], ['Campus Electric', 'Campus Gas'], 10023],
		['Campus All', 'short ton of CO₂', true, undefined, 'Campus All', ['Dining Hall Water', 'Great Dorm Water'], ['Campus Energy'], 10024],
		['Campus All - Another', 'short ton of CO₂', true, undefined, 'Campus All done another way with duplicate meter', ['Library Electric', 'Dining Hall Electric'], ['Dining Hall All', 'Theater All', 'Great Dorm All'], 10025]
	];

	// The table contains special units' data.
	// TODO some of these should probably be standard units (and related conversions)
	const units = [
		['Electric_Utility', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'],
		['Electric_Solar', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'],
		['Natural_Gas_BTU', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'],
		['Natural_Gas_M3', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'],
		['Water_Gallon', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'],
		['Water_Liter', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'],
		['Recycling', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'],
		['Electric_kW', '', Unit.unitRepresentType.FLOW, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'],
		['Temperature_Fahrenheit', '', Unit.unitRepresentType.RAW, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'],
		['Temperature_Celsius', '', Unit.unitRepresentType.RAW, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'],
		['US dollar', 'US $', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'special unit'],
		['pound', 'lb', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, false, 'special unit'],
		['short ton', 'ton', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, false, 'special unit'],
		['gallon', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'special unit'],
		['liter', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ADMIN, true, 'special unit'],
		['kW', '', Unit.unitRepresentType.FLOW, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'special unit'],
		['kg CO₂', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, 'CO₂', Unit.displayableType.ALL, false, 'special unit'],
	];

	// The table contains special conversions' data.
	const conversions = [
		['Electric_Utility', 'kWh', false, 1, 0, 'Electric_Utility → kWh'],
		['Electric_Utility', 'US dollar', false, 0.115, 0, 'Electric_Utility → US dollar'],
		['Electric_Utility', 'kg CO₂', false, 0.709, 0, 'Electric_Utility → kg CO₂'],
		['Electric_Solar', 'kWh', false, 1, 0, 'Electric_Solar → kWh'],
		['Electric_Solar', 'US dollar', false, 0.7, 0, 'Electric_Solar → US dollar'],
		['Electric_Solar', 'kg CO₂', false, 0, 0, 'Electric_Solar → kg CO₂ (zero value)'],
		['Natural_Gas_BTU', 'BTU', false, 1, 0, 'Natural_Gas_BTU → BTU'],
		['Natural_Gas_BTU', 'US dollar', false, 2.29e-6, 0, 'Natural_Gas_BTU → US dollar'],
		['Natural_Gas_BTU', 'kg CO₂', false, 5.28e-5, 0, 'Natural_Gas_BTU → kg CO₂'],
		['Natural_Gas_M3', 'm³ gas', false, 1, 0, 'Natural_Gas_M3 → m^3 gas'],
		['Natural_Gas_M3', 'US dollar', false, 0.11, 0, 'Natural_Gas_M3 → US dollar'],
		['Natural_Gas_M3', 'kg CO₂', false, 5.28e-5, 0, 'Natural_Gas_BTU → kg CO₂'],
		['Water_Gallon', 'gallon', false, 1, 0, 'Water_Gallon → gallon'],
		['Water_Gallon', 'kg CO₂', false, 1.7e-2, 0, 'Water_Gallon → kg CO₂'],  // TODO what is reasonable value for this?
		['Water_Gallon', 'US dollar', false, 0.15, 0, 'Water_Gallon → US dollar'],
		['Water_Liter', 'liter', false, 1, 0, 'Water_Liter → liter'],
		['Water_Liter', 'kg CO₂', false, 4.25e-3, 0, 'Water_Liter → kg CO₂'],  // TODO what is reasonable value for this?
		['Water_Liter', 'US dollar', false, 0.0397, 0, 'Water_Liter → US dollar'],
		['Temperature_Fahrenheit', 'Fahrenheit', false, 1, 0, 'Temperature_Fahrenheit → Fahrenheit'],
		['Temperature_Celsius', 'Celsius', false, 1, 0, 'Temperature_Celsius → Celsius'],
		['Electric_kW', 'kW', false, 1, 0, 'Electric kW → kW'],
		['Recycling', 'short ton', false, 1, 0, 'Recycling → short ton'],
		// This is what recycling saves and not the actual CO2 produced.
		['Recycling', 'kg CO₂', false, -2.89e3, 0, 'Recycling → kg CO₂'],
		// This assumes it costs the same to recycle as trash and you want the net cost as was done for Recycle CO2.
		['Recycling', 'US dollar', false, 0, 0, 'Recycling → US dollar'],
		['liter', 'gallon', true, 0.2641729, 0, 'Liter → Gallon'],
		['kg', 'pound', true, 2.2, 0, 'kg → lbs'],
		['short ton', 'pound', true, 2000, 0, 'ton → lbs'],
		['kg CO₂', 'kg', false, 1, 0, 'CO₂ → kg'],
		['gallon', 'liter', true, 3.7854, 0, 'gallon → liter']
	];

	const conn = getConnection();
	// These should be there after createDB but do it to be safe in case they are not present.
	// It will skip ones that already there.
	await insertStandardUnits(conn);
	await insertStandardConversions(conn);
	// Add desired units and conversions.
	await insertUnits(units, conn);
	await insertConversions(conversions, conn);
	// Recreate the Cik entries since changed units/conversions.
	// Do now since needed to insert meters with suffix units.
	await redoCik(conn);
	console.log(`Start loading each set of test data into OED meters (${meters.length} files of varying length, may take minutes):`);
	// await Meter.insertMany(meters, conn);
	await insertMeters(meters, conn);
	// Recreate the Cik entries since changed meters.
	await redoCik(conn);
	// Refresh the readings since added new ones.
	await refreshAllReadingViews();
	// await Group.insertMany(groups, conn);
	await insertGroups(groups, conn);
}

/**
 * Shifts the meters associated with comparison graphs to current time.
 * This can be run from inside the OED web Docker container with:
 * node -e 'require("./src/server/data/websiteData.js").webShift("cdt")'
 * where you replace the "cdt" with the values you want.
 * @param {*} timezone The timezone to use when shifting to current time.
  */
async function webShift(timezone) {
	// Do all but the last meter without refreshing the readings.
	for (let i = 0; i < compareMeters.length - 1; i++) {
		await shiftReadings(compareName(compareMeters[i]), timezone, false);
	}
	// Now do last meter where refresh readings.
	await shiftReadings(compareName(compareMeters[compareMeters.length - 1]), timezone, true);
}

module.exports = {
	insertWebsiteData,
	webShift
}
