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
const { specialUnitsGeneral, specialConversionsGeneral } = require('./automatedTestingData');
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
			area: 1000,
			areaUnit: 'meters',
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
			area: 1000,
			areaUnit: 'meters',
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
			area: 1000,
			areaUnit: 'meters',
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
			readingFrequency: '1:00:00',
			gps: '-87.99913, 40.002',
			area: 1000,
			areaUnit: 'meters',
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
			readingFrequency: '00:05:00',
			gps: '-87.99913, 40.002',
			area: 1000,
			areaUnit: 'meters',
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
			readingFrequency: '00:20:00',
			gps: '-87.9975, 40.0027',
			area: 10000,
			areaUnit: 'meters',
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
			readingFrequency: '00:20:00',
			gps: '-87.9975, 40.0027',
			area: 10000,
			areaUnit: 'meters',
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
			readingFrequency: '00:20:00',
			gps: '-87.9975, 40.0027',
			area: 10000,
			areaUnit: 'meters',
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
			readingFrequency: '00:20:00',
			gps: '-87.9975, 40.0027',
			area: 10000,
			areaUnit: 'meters',
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
			readingFrequency: '00:20:00',
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
			readingFrequency: '00:23:00',
			gps: '-87.99916, 40.00419',
			area: 100000,
			areaUnit: 'meters',
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
			readingFrequency: '00:23:00',
			gps: '-87.99916, 40.00419',
			area: 100000,
			areaUnit: 'meters',
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
			readingFrequency: '00:20:00',
			gps: undefined,
			note: undefined,
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
			readingFrequency: '00:20:00',
			gps: '-87.99817, 40.00057',
			area: 5000,
			areaUnit: 'meters',
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
			readingFrequency: '00:20:00',
			gps: '-87.99817, 40.00057',
			area: 5000,
			areaUnit: 'meters',
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
			readingFrequency: '00:20:00',
			gps: '-87.99817, 40.00057',
			area: 5000,
			areaUnit: 'meters',
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
			readingFrequency: '00:20:00',
			gps: '-87.99817, 40.00057',
			area: 5000,
			areaUnit: 'meters',
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
			readingFrequency: '00:20:00',
			gps: '-87.99817, 40.00057',
			area: 10000,
			areaUnit: 'meters',
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
			readingFrequency: '00:15:00',
			gps: '-87.99817, 40.00057',
			area: 10000,
			areaUnit: 'meters',
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
			readingFrequency: '7 days',
			gps: undefined,
			note: undefined,
			file: 'data/webData/CampusRecycling.csv',
			deleteFile: false,
			id: 10026
		},
	];

	// The table contains groups' data.
	// The ids start at 10012 for similar reasons to meters but gives different colors
	// since it goes backward through the color array.
	// TODO: When this is converted to key/value pairs, the area should be set to the comparable meter(s) and campus is the sum of all 121,000.
	const groups = [
		{
			name: 'Dining Hall Energy',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: '-87.99913, 40.002',
			note: 'Dining Hall Electric and Gas',
			area: 1000,
			areaUnit: 'meters',
			childMeters: ['Dining Hall Electric', 'Dining Hall Gas'],
			childGroups: [],
			id: 10012
		},
		{
			name: 'Dining Hall All',
			defaultGraphicUnit: 'short ton of CO₂',
			displayable: true,
			gps: '-87.99913, 40.002',
			note: 'Dining Hall All',
			area: 1000,
			areaUnit: 'meters',
			childMeters: ['Dining Hall Water'],
			childGroups: ['Dining Hall Energy'],
			id: 10013
		},
		{
			name: 'Theater Energy',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: ' -87.9975, 40.0027',
			note: 'Theater Electric and Gas',
			area: 10000,
			areaUnit: 'meters',
			childMeters: ['Theater Electric', 'Theater Gas'],
			childGroups: [],
			id: 10014
		},
		{
			name: 'Theater All',
			defaultGraphicUnit: 'short ton of CO₂',
			displayable: true,
			gps: ' -87.9975, 40.0027',
			note: 'Theater All',
			area: 10000,
			areaUnit: 'meters',
			childMeters: [],
			childGroups: ['Theater Energy'],
			id: 10015
		},
		{
			name: 'Dining & Theater Electric Power',
			defaultGraphicUnit: 'kW',
			displayable: true,
			note: 'Dining & Theater Electric Power',
			areaUnit: 'meters',
			childMeters: ['Dining Hall Electric Power', 'Theater Electric Power'],
			childGroups: [],
			id: 10016
		},
		{
			name: 'Library Energy',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: '-87.99916, 40.00419',
			note: 'Library Electric',
			area: 100000,
			areaUnit: 'meters',
			childMeters: ['Library Electric'],
			childGroups: [],
			id: 10017
		},
		// Great Dorm Electric with 1st and 2nd floor Great Dorm Electric
		{
			name: compareGroups[0],
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: '-87.99817, 40.00057',
			note: 'Great Dorm 1st & 2nd Electric',
			area: 10000,
			areaUnit: 'meters',
			childMeters: [compareMeters[3], compareMeters[4]],
			childGroups: [],
			id: 10018
		},
		{
			name: compareName(compareGroups[0]),
			defaultGraphicUnit: 'kWh',
			displayable: false,
			gps: '-87.99817, 40.00057',
			note: 'Great Dorm 1st & 2nd Electric',
			area: 10000,
			areaUnit: 'meters',
			childMeters: [compareName(compareMeters[3]), compareName(compareMeters[4])],
			childGroups: [],
			id: compareId(10018)
		},
		{
			name: 'Great Dorm Energy',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: '-87.99817, 40.00057',
			note: 'Great Dorm Electric and Gas',
			area: 10000,
			areaUnit: 'meters',
			childMeters: ['Great Dorm Gas'],
			childGroups: ['Great Dorm Electric'],
			id: 10019
		},
		{
			name: 'Great Dorm All',
			defaultGraphicUnit: 'short ton of CO₂',
			displayable: true,
			gps: '-87.99817, 40.00057',
			note: 'Great Dorm All',
			area: 10000,
			areaUnit: 'meters',
			childMeters: ['Great Dorm Water'],
			childGroups: ['Great Dorm Energy'],
			id: 10020
		},
		{
			name: 'Campus Electric',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			note: 'Campus Electric',
			area: 121000,
			areaUnit: 'meters',
			childMeters: ['Dining Hall Electric', 'Theater Electric', 'Library Electric'],
			childGroups: ['Great Dorm Electric'],
			id: 10021
		},
		{
			name: 'Campus Gas',
			defaultGraphicUnit: 'BTU',
			displayable: true,
			note: 'Campus Gas',
			area: 121000,
			areaUnit: 'meters',
			childMeters: ['Dining Hall Gas', 'Theater Gas', 'Great Dorm Gas'],
			childGroups: [],
			id: 10022
		},
		{
			name: 'Campus Energy',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			note: 'Campus Energy',
			area: 121000,
			areaUnit: 'meters',
			childMeters: [],
			childGroups: ['Campus Electric', 'Campus Gas'],
			id: 10023
		},
		{
			name: 'Campus All',
			defaultGraphicUnit: 'short ton of CO₂',
			displayable: true,
			note: 'Campus All',
			area: 121000,
			areaUnit: 'meters',
			childMeters: ['Dining Hall Water', 'Great Dorm Water'],
			childGroups: ['Campus Energy'],
			id: 10024
		},
		{
			name: 'Campus All - Another',
			defaultGraphicUnit: 'short ton of CO₂',
			displayable: true,
			note: 'Campus All done another way with duplicate meter',
			area: 121000,
			areaUnit: 'meters',
			childMeters: ['Library Electric', 'Dining Hall Electric'],
			childGroups: ['Dining Hall All', 'Theater All', 'Great Dorm All'],
			id: 10025
		},
		// Great Dorm Electric with 1st and 2nd floor Great Dorm Electric special vary
		{
			name: 'Great Dorm Electric Vary',
			defaultGraphicUnit: 'kWh',
			displayable: false,
			gps: '-87.99817, 40.00057',
			note: 'Great Dorm Electric for use when shift 2nd floor to current',
			area: 10000,
			areaUnit: 'meters',
			childMeters: [compareMeters[3], compareName(compareMeters[4])],
			childGroups: [],
			id: 10026
		}
	];

	// This array contains web unit data. It adds on the ones for web from the general special units.
	const units = specialUnitsGeneral.concat([
		{
			name: 'Electric_Solar',
			identifier: '',
			unitRepresent: Unit.unitRepresentType.QUANTITY,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.METER,
			suffix: '',
			displayable: Unit.displayableType.NONE,
			preferredDisplay: false,
			note: 'special unit'
		},
		{
			name: 'Water_Liter',
			identifier: '',
			unitRepresent: Unit.unitRepresentType.QUANTITY,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.METER,
			suffix: '',
			displayable: Unit.displayableType.NONE,
			preferredDisplay: false,
			note: 'special unit'
		},
		{
			name: 'Recycling',
			identifier: '',
			unitRepresent: Unit.unitRepresentType.QUANTITY,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.METER,
			suffix: '',
			displayable: Unit.displayableType.NONE,
			preferredDisplay: false,
			note: 'special unit'
		},
		{
			name: 'Temperature_Celsius',
			identifier: '',
			unitRepresent: Unit.unitRepresentType.RAW,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.METER,
			suffix: '',
			displayable: Unit.displayableType.NONE,
			preferredDisplay: false,
			note: 'special unit'
		},
		{
			name: 'pound',
			identifier: 'lb',
			unitRepresent: Unit.unitRepresentType.QUANTITY,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.UNIT,
			suffix: '',
			displayable: Unit.displayableType.ALL,
			preferredDisplay: false,
			note: 'special unit'
		},
		{
			name: 'short ton',
			identifier: 'ton',
			unitRepresent: Unit.unitRepresentType.QUANTITY,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.UNIT,
			suffix: '',
			displayable: Unit.displayableType.ALL,
			preferredDisplay: false,
			note: 'special unit'
		},
	]);

	// The table contains special conversions' data.
	const conversions = specialConversionsGeneral.concat([
		{
			sourceName: 'Electric_Solar',
			destinationName: 'kWh',
			bidirectional: false,
			slope: 1,
			intercept: 0,
			note: 'Electric_Solar → kWh'
		},
		{
			sourceName: 'Electric_Solar',
			destinationName: 'US dollar',
			bidirectional: false,
			slope: 0.7,
			intercept: 0,
			note: 'Electric_Solar → US dollar'
		},
		{
			sourceName: 'Electric_Solar',
			destinationName: 'kg CO₂',
			bidirectional: false,
			slope: 0,
			intercept: 0,
			note: 'Electric_Solar → kg CO₂ (zero value)'
		},
		{
			sourceName: 'Natural_Gas_BTU',
			destinationName: 'US dollar',
			bidirectional: false,
			slope: 6.75e-6,
			intercept: 0,
			note: 'Natural_Gas_BTU → US dollar'
		},
		{
			sourceName: 'Natural_Gas_M3',
			destinationName: 'kg CO₂',
			bidirectional: false,
			slope: 1.94,
			intercept: 0,
			note: 'Natural_Gas_M3 → kg CO₂'
		},
		// Average of https://www.danfoss.com/en/about-danfoss/articles/dhs/the-carbon-footprint-of-potable-water/
		// and https://www.brightest.io/calculate-carbon-footprint-water-emissions for water CO2.
		{
			sourceName: 'Water_Gallon',
			destinationName: 'kg CO₂',
			bidirectional: false,
			slope: 1.2e-3,
			intercept: 0,
			note: 'Water_Gallon → kg CO₂'
		},
		{
			sourceName: 'Water_Gallon',
			destinationName: 'US dollar',
			bidirectional: false,
			slope: 0.011,
			intercept: 0,
			note: 'Water_Gallon → US dollar'
		},
		{
			sourceName: 'Water_Liter',
			destinationName: 'liter',
			bidirectional: false,
			slope: 1,
			intercept: 0,
			note: 'Water_Liter → liter'
		},
		{
			sourceName: 'Water_Liter',
			destinationName: 'kg CO₂',
			bidirectional: false,
			slope: 3.1e-4,
			intercept: 0,
			note: 'Water_Liter → kg CO₂'
		},
		{
			sourceName: 'Water_Liter',
			destinationName: 'US dollar',
			bidirectional: false,
			slope: 0.00291,
			intercept: 0,
			note: 'Water_Liter → US dollar'
		},
		{
			sourceName: 'Temperature_Celsius',
			destinationName: 'Celsius',
			bidirectional: false,
			slope: 1,
			intercept: 0,
			note: 'Temperature_Celsius → Celsius'
		},
		{
			sourceName: 'Recycling',
			destinationName: 'short ton',
			bidirectional: false,
			slope: 1,
			intercept: 0,
			note: 'Recycling → short ton'
		},
		// This is what recycling saves and not the actual CO2 produced.
		{
			sourceName: 'Recycling',
			destinationName: 'kg CO₂',
			bidirectional: false,
			slope: -2.89e3,
			intercept: 0,
			note: 'Recycling → kg CO₂'
		},
		// This assumes it costs the same to recycle as trash and you want the net cost as was done for Recycle CO2.
		{
			sourceName: 'Recycling',
			destinationName: 'US dollar',
			bidirectional: false,
			slope: 0,
			intercept: 0,
			note: 'Recycling → US dollar'
		},
		{
			sourceName: 'kg',
			destinationName: 'pound',
			bidirectional: true,
			slope: 2.2,
			intercept: 0,
			note: 'kg ↔ lbs'
		},
		{
			sourceName: 'short ton',
			destinationName: 'pound',
			bidirectional: true,
			slope: 2000,
			intercept: 0,
			note: 'ton ↔ lbs'
		},
	]);

	const conn = getConnection();
	// These should be there after createDB but do it to be safe in case they are not present.
	// It will skip ones that already there.
	await insertStandardUnits(conn);
	await insertStandardConversions(conn);
	// Add desired units and conversions where update as needed.
	await insertUnits(units, true, conn);
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
