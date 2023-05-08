/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This file contains a series of functions used to generate (at some point automated - hopefully) test data.
 */

const { generateSine, generateCosine } = require('./generateTestingData');
const Unit = require('../models/Unit');
const { insertUnits, insertStandardUnits, insertConversions, insertStandardConversions, insertMeters, insertGroups } = require('../util/insertData');
const { getConnection } = require('../db');
const { redoCik } = require('../services/graph/redoCik');
const { refreshAllReadingViews } = require('../services/refreshAllReadingViews');
const fs = require('fs').promises;

// Define the start and end date for data generation.
const DEFAULT_OPTIONS = {
	// First day to generate data is Jan. 1, 2020.
	startDate: '2020-01-01 00:00:00',
	// Last day to generate data for 1 year is Dec. 31, 2020.
	endDateOneYr: '2020-12-31 23:59:59',
	// Last day to generate data  for 2 years is Dec. 31, 2021.
	endDateTwoYr: '2021-12-31 23:59:59',
	// Wave period set to 45 days so every 45 days goes though a complete period of sine or cosine.
	// Use days instead of 1.5 months because moment changes number of days depending on length
	// of the month.
	periodLength: { day: 45 }
}
/**
 * Generates sinusoidal testing data over a two year period (2020 to 2021, inclusive)
 * with a 45 day sine period with normalized by hour values and
 * saves the data in an appropriately-named file under '../test/db/data/automatedTests/'.
 * @param {number} [frequency=15] desired frequency of the sinusoidal test data (in minutes).
 * @param {number} [amplitude=1] desired amplitude of the sinusoidal test data.
 */
async function generateSineTestingData(frequency = 15, amplitude = 1) {
	const startDate = DEFAULT_OPTIONS.startDate;
	const endDate = DEFAULT_OPTIONS.endDateTwoYr;
	const options = {
		timeStep: { minute: frequency },
		periodLength: DEFAULT_OPTIONS.periodLength,
		maxAmplitude: amplitude,
		filename: path.join(__dirname, '../test/db/data/automatedTests/' + frequency.toString()
			+ 'Freq' + amplitude.toString() + 'AmpSineTestData.csv'),
		normalize: true
	};
	await generateSine(startDate, endDate, options);
}

/**
 * Generates squared sinusoidal testing data over a one year period (2020)
 * with a 45 day sine period, normalized by hour values with a point each day and
 * saves the data in an appropriately named file under '../test/db/data/automatedTests/'.
 * @param {number} [amplitude=1] desired amplitude of the sinusoidal squared test data.
 */
async function generateSineSquaredTestingData(amplitude = 1) {
	const startDate = DEFAULT_OPTIONS.startDate;
	const endDate = DEFAULT_OPTIONS.endDateOneYr;
	const options = {
		// OED should graph this data with daily points so we generate to match. This means that
		// the value will remain unchanged from the calculated value since no average is needed.
		// If you do average then you are averaging the square of the sin for each point.
		// For example, if had a point every 12 hours then you would have 2 points per day.
		// Without considering scaling, this means you would do
		// (sinpt1^2 + sinpt2^2) / 2
		// because the generation code squares each value to feed into OED.
		// But what you really wanted was the square of the sin value or
		// ((sinpt1 + sinpt 2) / 2) ^2
		// Unfortunately, these are not the same. So, to avoid this problem, only 1 day is used so
		// no averaging is done. When you zoom into an hourly view, you get the same value since this is
		// kW and they do not change as you zoom in. Another way to think about it is that the hourly
		// points in kWh are 1/24 the day point but then you divide by 1 hour instead of 24 hours so it turns
		// out the same.
		timeStep: { day: 1 },
		periodLength: DEFAULT_OPTIONS.periodLength,
		// The data will be normalized to the hour. OED will normalize to scale the final value by the number of
		// hours (to go from kWh to kW) which is 1/ 24. Also, the generation code will change the scaling factor
		// by a factor of 24 for a similar reason. Thus, you want
		// amplitude * 24 = (sin * 24 * scale)^2
		// because the scale will be normalized by a factor of 24 and the code will square this value times
		// the actual sin value. The max value of sin is 1 so the solution is
		// scale = sqrt(amplitude / 24)
		// Thus, we now change the amplitude given to this value so the final max value is what was given.
		maxAmplitude: Math.sqrt(amplitude / 24),
		// This is intended to be used to sum with cos^2. For that to give a constant value, you need
		// to allow sin & cos to range from -1 to +1 so you don't want to shift as normally done when
		// using this data to represent meter data directly. Since squaring, the final result will be
		// positive so an okay meter value.
		// It is also necessary for the sin^2 and cos^2 to have the same amplitude for the sum to
		// yield a constant value.
		noShift: true,
		filename: path.join(__dirname, '../test/db/data/automatedTests/' + amplitude.toString() + 'AmpSineSquaredTestData.csv'),
		squared: true // Option set to true because want sine *squared* data.
	};
	await generateSine(startDate, endDate, options);
}

/**
 * Generates cosinusoidal testing data over a one year period (2020)
 * with a 45 day sine period with normalized by hour values and
 * then saves the data in an appropriately-named file under '../test/db/data/automatedTests/'.
 * @param {number} [frequency=15] - desired frequency of the cosinusoidal test data (in minutes).
 * @param {number} [amplitude=1] - desired amplitude of the cosinusoidal test data.
 */
async function generateCosineTestingData(frequency = 15, amplitude = 1) {
	const startDate = DEFAULT_OPTIONS.startDate;
	const endDate = DEFAULT_OPTIONS.endDateOneYr;
	const options = {
		timeStep: { minute: frequency },
		periodLength: DEFAULT_OPTIONS.periodLength,
		maxAmplitude: amplitude,
		filename: path.join(__dirname, '../test/db/data/automatedTests/' + frequency.toString() + 'FreqCosineTestData.csv')
	};
	await generateCosine(startDate, endDate, options);
}

/**
 * Generates squared cosinusoidal testing data over a one year period (2020)
 * with a 45 day cosine period with normalized by hour values and
 * saves the data in an appropriately named file under '../test/db/data/automatedTests/'.
 * @param {number} [amplitude=1] - desired amplitude of the squared cosinusoidal test data.
 */
async function generateCosineSquaredTestingData(amplitude = 1) {
	const startDate = DEFAULT_OPTIONS.startDate;
	const endDate = DEFAULT_OPTIONS.endDateOneYr;
	const options = {
		// OED should graph this data with daily points so we generate to match. This means that
		// the value will remain unchanged from the calculated value since no average is needed.
		// If you do average then you are averaging the square of the sin for each point.
		// For example, if had a point every 12 hours then you would have 2 points per day.
		// Without considering scaling, this means you would do
		// (sinpt1^2 + sinpt2^2) / 2
		// because the generation code squares each value to feed into OED.
		// But what you really wanted was the square of the sin value or
		// ((sinpt1 + sinpt 2) / 2) ^2
		// Unfortunately, these are not the same. So, to avoid this problem, only 1 day is used so
		// no averaging is done. When you zoom into an hourly view, you get the same value since this is
		// kW and they do not change as you zoom in. Another way to think about it is that the hourly
		// points inkWh are 1/24 the day point but then you divide by 1 hour instead of 24 hours so it turns
		// out the same.
		timeStep: { day: 1 },
		periodLength: DEFAULT_OPTIONS.periodLength,
		// The data will be normalized to the hour. OED will normalize scale the final value by the number of
		// hours (to go from kWh to kW) which is 1/ 24. Also, the generation code will change the scaling factor
		// by a factor of 24 for a similar reason. Thus, you want
		// amplitude * 24 = (sin * 24 * scale)^2
		// because the scale will be normalized by a factor of 24 and the code will square this value times
		// the actual sin value. The max value of sin is 1 so the solution is
		// scale = sqrt(amplitude / 24)
		// Thus, we now change the amplitude given to this value so the final max value is what was given.
		maxAmplitude: Math.sqrt(amplitude / 24),
		// This is intended to be used to sum with cos^2. For that to give a constant value, you need
		// to allow sin & cos to range from -1 to +1 so you don't want to shift as normally done when
		// using this data to represent meter data directly. Since squaring, the final result will be
		// positive so an okay meter value.
		// It is also necessary for the sin^2 and cos^2 to have the same amplitude for the sum to
		// yield a constant value.
		noShift: true,
		filename: path.join(__dirname, '../test/db/data/automatedTests/' + amplitude.toString() + 'AmpCosineSquaredTestData.csv'),
		squared: true // Option set to true because want cosine *squared* data.
	};
	await generateCosine(startDate, endDate, options);
}

/*
 * The next five functions -- generateFourDayTestingData(), generateFourHourTestingData(), generateTwentyThreeMinuteTestingData(),
 * generateFifteenMinuteTestingData(), and generateOneMinuteTestingData() -- have no parameters as they generate one year of data at
 * pre-specified intervals. All have wave periods of 45 days for easy visual display.
 *
 * Please see the documentation for 'generateSine()' under 'generateTestingData.js' for more details.
 */

/**
 * Generates one year of sinusoidal testing data (for the whole year of 2020) at 4 day intervals
 * with a 45 day sine period and amplitude 3 with normalized by hour values and saved in file
 * 'fourDayFreqTestData.csv' under '../test/db/data/automatedTests/'.
 */
async function generateFourDayTestingData() {
	const startDate = DEFAULT_OPTIONS.startDate;
	const endDate = DEFAULT_OPTIONS.endDateOneYr;
	const options = {
		timeStep: { day: 4 },
		periodLength: DEFAULT_OPTIONS.periodLength,
		maxAmplitude: 3,
		// Data saved in 'fourDayFreqTestData.csv' file.
		filename: path.join(__dirname, '../test/db/data/automatedTests/fourDayFreqTestData.csv')
	};
	await generateSine(startDate, endDate, options);
}

/**
 * Generates one year of sinusoidal testing data (for the whole year of 2020) at 4 hour intervals
 * with a 45 day sine period and amplitude 3 with normalized by hour values and saved in file
 * 'fourHourFreqTestData.csv' under '../test/db/data/automatedTests/'.
 */
async function generateFourHourTestingData() {
	const startDate = DEFAULT_OPTIONS.startDate;
	const endDate = DEFAULT_OPTIONS.endDateOneYr;
	const options = {
		// Data point intervals set to 240 minutes = 4 hours.
		timeStep: { hour: 4 },
		periodLength: DEFAULT_OPTIONS.periodLength,
		maxAmplitude: 3,
		// Data saved in 'fourHourFreqTestData.csv' file
		filename: path.join(__dirname, '../test/db/data/automatedTests/fourHourFreqTestData.csv')
	};
	await generateSine(startDate, endDate, options);
}

/**
 * Generates one year of sinusoidal testing data (for the whole year of 2020) at 23 minute intervals
 * with a 45 day sine period and amplitude 3 with normalized by hour values and saved in file
 * 'twentyThreeMinuteFreqTestData.csv' under '../test/db/data/automatedTests/'.
 */
async function generateTwentyThreeMinuteTestingData() {
	const startDate = DEFAULT_OPTIONS.startDate;
	const endDate = DEFAULT_OPTIONS.endDateOneYr;
	const options = {
		timeStep: { minute: 23 }, // Data point intervals set to 23 minutes.
		periodLength: DEFAULT_OPTIONS.periodLength,
		maxAmplitude: 3,
		// Data saved in 'twentyThreeMinuteFreqTestData.csv' file.
		filename: path.join(__dirname, '../test/db/data/automatedTests/twentyThreeMinuteFreqTestData.csv')
	};
	await generateSine(startDate, endDate, options);
}

/**
 * Generates one year of sinusoidal testing data (for the whole year of 2020) at 15 minute intervals
 * with a 45 day sine period and amplitude 3 with normalized by hour values and saved in file
 * 'fifteenMinuteFreqTestData.csv' under '../test/db/data/automatedTests/'.
 */
async function generateFifteenMinuteTestingData() {
	const startDate = DEFAULT_OPTIONS.startDate;
	const endDate = DEFAULT_OPTIONS.endDateOneYr;
	const options = {
		timeStep: { minute: 15 }, // Data point intervals set to 15 minutes.
		periodLength: DEFAULT_OPTIONS.periodLength,
		maxAmplitude: 3,
		// Data saved in 'fifteenMinuteFreqTestData.csv' file.
		filename: path.join(__dirname, '../test/db/data/automatedTests/fifteenMinuteFreqTestData.csv')
	};
	await generateSine(startDate, endDate, options);
}

/**
 * Generates one year of sinusoidal testing data (for the whole year of 2020) at 1 minute intervals
 * with a 45 day sine period and amplitude 3 with normalized by hour values and saved in file
 * 'oneMinuteFreqTestData.csv' under '../test/db/data/automatedTests/'.
 */
async function generateOneMinuteTestingData() {
	const startDate = DEFAULT_OPTIONS.startDate;
	const endDate = DEFAULT_OPTIONS.endDateOneYr;
	const options = {
		timeStep: { minute: 1 }, // Data point intervals set to 1 minute.
		periodLength: DEFAULT_OPTIONS.periodLength,
		maxAmplitude: 3,
		// Data saved in 'oneMinuteFreqTestData.csv' file.
		filename: path.join(__dirname, '../test/db/data/automatedTests/oneMinuteFreqTestData.csv')
	};
	await generateSine(startDate, endDate, options);
}

/**
 * Calls the above functions with appropriate parameters to generate all the necessary testing data.
 * Each of the function calls will generate a csv file under '../test/db/data/automatedTests' that is needed for automated testing.
 */
async function generateTestingData() {
	// Generates 1 year of sinusoidal data with data points at 4-day intervals
	await generateFourDayTestingData();

	// Generates 1 year of sinusoidal data with data points at 4-hour intervals
	await generateFourHourTestingData();

	// Generates 1 year of sinusoidal data with data points at 23-minute intervals
	await generateTwentyThreeMinuteTestingData();

	// Generates 1 year of sinusoidal data with data points at 15-minute intervals
	await generateFifteenMinuteTestingData();

	// Generates 1 year of sinusoidal data with data points at 1-minute intervals.
	// Normally not desired so commented out.
	// generateOneMinuteTestingData();

	// Generates 1 year of cosinusoidal data with an amplitude of 3 and with data points at 23-minute intervals.
	// Should be related to 23-minute sinusoidal above.
	await generateCosineTestingData(23, 3);

	// Generates 2 years of *squared* sinusoidal data with an amplitude of 2.5 and with data points at 1-day intervals.
	await generateSineSquaredTestingData(2.5);

	// Generates 2 years of *squared* cosinusoidal data with an amplitude of 2.5 and with data points at 1-day intervals.
	await generateCosineSquaredTestingData(2.5);
}

/**
 * Generates 7 files, all containing 2 years of sinusoidal data, and each with a unique amplitude between 1 and 7. More specifically,
 * the first file contains sine waves with an amplitude of 1, the second contains waves with an amplitude of 2, and so on until
 * the seventh which contains waves an amplitude of 7.
 */
async function generateVariableAmplitudeTestingData() {
	for (var i = 1; i <= 7; i++) {
		await generateSineTestingData(15, i);
	}
}

/**
 * Generate mathematical test data.
 */
async function testData() {
	console.log("Start generating first set of test data (square, varying freq of readings: 7 files):");
	await generateTestingData();
	console.log("Start generating second set of test data (varying amplitudes: 7 files):")
	await generateVariableAmplitudeTestingData();
}

/**
 * Inserts special units into the database.
 */
async function insertSpecialUnits(conn) {
	// The table contains special units' data.
	const specialUnits = [
		['Electric_Utility', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'],
		['Natural_Gas_BTU', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'],
		['100 w bulb', '100 w bulb for 10 hrs', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, false, 'special unit'],
		['Natural_Gas_M3', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'],
		['Natural_Gas_Dollar', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'],
		['Water_Gallon', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'],
		['US dollar', 'US $', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'special unit'],
		['euro', '€', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'special unit'],
		['gallon', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'special unit'],
		['liter', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'special unit'],
		['kg CO₂', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, 'CO₂', Unit.displayableType.ALL, false, 'special unit'],
		['Trash', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'],
		['Temperature_Fahrenheit', '', Unit.unitRepresentType.RAW, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'],
		['kW', '', Unit.unitRepresentType.FLOW, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'special unit'],
		['Electric_kW', '', Unit.unitRepresentType.FLOW, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'],
		['gallon per minute', 'gallon (rate)', Unit.unitRepresentType.FLOW, 60, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'special unit'],
		['liter per hour', 'liter (rate)', Unit.unitRepresentType.FLOW, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'special unit'],
		['Water_Gallon_Per_Minute', '', Unit.unitRepresentType.FLOW, 60, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit']
	];
	await insertUnits(specialUnits, conn);
}


/**
 * Insert special conversions into the database.
 */
async function insertSpecialConversions(conn) {
	// The table contains special conversions' data.
	const specialConversions = [
		['kWh', '100 w bulb', false, 1, 0, 'kWh → 100 w bulb'],
		['Electric_Utility', 'kWh', false, 1, 0, 'Electric_Utility → kWh'],
		['Electric_Utility', 'US dollar', false, 0.115, 0, 'Electric_Utility → US dollar'],
		['Electric_Utility', 'kg CO₂', false, 0.709, 0, 'Electric_Utility → CO2'],
		['Natural_Gas_BTU', 'BTU', false, 1, 0, 'Natural_Gas_BTU → BTU'],
		['Natural_Gas_BTU', 'euro', false, 2.6e-6, 0, 'Natural_Gas_BTU → euro'],
		['Natural_Gas_BTU', 'kg CO₂', false, 5.28e-5, 0, 'Natural_Gas_BTU → CO2'],
		['Natural_Gas_M3', 'm³ gas', false, 1, 0, 'Natural_Gas_M3 → m3 of gas'],
		['Natural_Gas_M3', 'US dollar', false, 0.11, 0, 'Natural_Gas_M3 → US dollar'],
		['Water_Gallon', 'gallon', false, 1, 0, 'Water_Gallon → gallon'],
		['liter', 'gallon', true, 0.2641729, 0, 'liter → gallon'],
		['US dollar', 'euro', true, 0.88, 0, 'US dollar → euro'],
		['Natural_Gas_Dollar', 'US dollar', false, 1, 0, 'Natural_Gas_Dollar → US dollar'],
		['kg CO₂', 'kg', false, 1, 0, 'CO2 → kg'],
		['Trash', 'kg CO₂', false, 3.24e-6, 0, 'Trash → CO2'],
		['Trash', 'kg', false, 1, 0, 'Trash → kg'],
		['Temperature_Fahrenheit', 'Fahrenheit', false, 1, 0, 'Temperature_Fahrenheit → Fahrenheit'],
		['Electric_kW', 'kW', false, 1, 0, 'Electric_kW → kW'],
		['Water_Gallon_Per_Minute', 'gallon per minute', false, 1, 0, 'Water_Gallon_Per_Minute → gallon per minute'],
		['gallon per minute', 'liter per hour', true, 227.12398, 0, 'gallon per minute → liter per hour']
	];
	await insertConversions(specialConversions, conn);
}

/**
 * Call the functions to insert special units, conversions, meters and groups.
 */
async function insertSpecialUnitsConversionsMetersGroups() {
	// The table contains special meters' data.
	// Should only delete automatically generated ones.
	// Don't check cases of no default graphic unit since it is set to unit_id for meters.
	const specialMeters = [
		{
			name: 'Electric Utility kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'data/unit/quantity1-5.csv',
			// Some points less than 1 day but this is what is typical.
			readingFrequency: '1 days',
			area: 10,
			areaUnit: 'feet',
			deleteFile: false
		},
		{
			name: 'Electric Utility kWh 2-6',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'data/unit/quantity2-6.csv',
			readingFrequency: '1 days',
			area: 10,
			areaUnit: 'meters',
			deleteFile: false
		},
		{
			name: 'Electric Utility kWh in BTU',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'BTU',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'data/unit/quantity1-5.csv',
			// Some points less than 1 day but this is what is typical.
			readingFrequency: '1 days',
			area: 10,
			areaUnit: 'feet',
			deleteFile: false
		},
		{
			name: 'Electric Utility kWh in MTon CO₂',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'metric ton of CO₂',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'data/unit/quantity1-5.csv',
			// Some points less than 1 day but this is what is typical.
			readingFrequency: '1 days',
			area: 10,
			areaUnit: 'feet',
			deleteFile: false
		},
		{
			name: 'Electric Utility no unit',
			unit: '',
			defaultGraphicUnit: '',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'data/unit/quantity1-5.csv',
			// Some points less than 1 day but this is what is typical.
			readingFrequency: '1 days',
			deleteFile: false
		},
		{
			name: 'Electric Utility kWh not displayable',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: false,
			gps: undefined,
			note: 'special meter',
			file: 'data/unit/quantity1-5.csv',
			// Some points less than 1 day but this is what is typical.
			readingFrequency: '1 days',
			deleteFile: false
		},
		{
			name: 'Natural Gas BTU',
			unit: 'Natural_Gas_BTU',
			defaultGraphicUnit: 'BTU',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'data/unit/quantity1-5.csv',
			// Some points less than 1 day but this is what is typical.
			readingFrequency: '1 days',
			area: 10,
			areaUnit: 'feet',
			deleteFile: false
		},
		{
			name: 'Natural Gas BTU in Dollar',
			unit: 'Natural_Gas_BTU',
			defaultGraphicUnit: 'US dollar',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'data/unit/quantity1-5.csv',
			// Some points less than 1 day but this is what is typical.
			readingFrequency: '1 days',
			area: 10,
			areaUnit: 'feet',
			deleteFile: false
		},
		{
			name: 'Natural Gas Dollar',
			unit: 'Natural_Gas_Dollar',
			defaultGraphicUnit: 'US dollar',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'data/unit/quantity1-5.csv',
			// Some points less than 1 day but this is what is typical.
			readingFrequency: '1 days',
			area: 10,
			areaUnit: 'feet',
			deleteFile: false
		},
		{
			name: 'Natural Gas Cubic Meters',
			unit: 'Natural_Gas_M3',
			defaultGraphicUnit: 'm³ gas',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'data/unit/quantity1-5.csv',
			// Some points less than 1 day but this is what is typical.
			readingFrequency: '1 days',
			area: 10,
			areaUnit: 'feet',
			deleteFile: false
		},
		{
			name: 'Water Gallon',
			unit: 'Water_Gallon',
			defaultGraphicUnit: 'gallon',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'data/unit/quantity1-5.csv',
			// Some points less than 1 day but this is what is typical.
			readingFrequency: '1 days',
			area: 10,
			areaUnit: 'feet',
			deleteFile: false
		},
		{
			name: 'Trash Kg',
			unit: 'Trash',
			defaultGraphicUnit: 'kg',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'data/unit/quantity1-5.csv',
			// Some points less than 1 day but this is what is typical.
			readingFrequency: '1 days',
			area: 10,
			areaUnit: 'feet',
			deleteFile: false
		},
		{
			name: 'Temp Fahrenheit 0-212',
			unit: 'Temperature_Fahrenheit',
			defaultGraphicUnit: 'Fahrenheit',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'data/unit/temp0-212.csv',
			// Many points less than 1 day but only 1 per day.
			readingFrequency: '1 days',
			deleteFile: false
		},
		{
			name: 'Temp Fahrenheit in Celsius',
			unit: 'Temperature_Fahrenheit',
			defaultGraphicUnit: 'Celsius',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'data/unit/temp0-212.csv',
			// Many points less than 1 day but only 1 per day.
			readingFrequency: '1 days',
			deleteFile: false
		},
		{
			name: 'Electric kW',
			unit: 'Electric_kW',
			defaultGraphicUnit: 'kW',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'data/unit/rate1-5.csv',
			// Some points less than 1 day but this is what is typical.
			readingFrequency: '1 days',
			area: 10,
			areaUnit: 'feet',
			deleteFile: false
		},
		{
			name: 'Electric kW 2-6',
			unit: 'Electric_kW',
			defaultGraphicUnit: 'kW',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'data/unit/rate2-6.csv',
			readingFrequency: '1 days',
			area: 10,
			areaUnit: 'meters',
			deleteFile: false
		},
		{
			name: 'Water Gallon flow 1-5 per minute',
			unit: 'Water_Gallon_Per_Minute',
			defaultGraphicUnit: 'gallon per minute',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'data/unit/rate1-5.csv',
			// Some points less than 1 day but this is what is typical.
			readingFrequency: '1 days',
			area: 10,
			areaUnit: 'feet',
			deleteFile: false
		},
		{
			name: 'test4DaySin kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'test/db/data/automatedTests/fourDayFreqTestData.csv',
			readingFrequency: '4 days',
			area: 10,
			areaUnit: 'feet',
			deleteFile: true
		},
		{
			name: 'test4HourSin kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'test/db/data/automatedTests/fourHourFreqTestData.csv',
			// Some points less than 1 day but this is what is typical.
			readingFrequency: '4 hours',
			area: 10,
			areaUnit: 'feet',
			deleteFile: true
		},
		{
			name: 'test23MinSin kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'test/db/data/automatedTests/twentyThreeMinuteFreqTestData.csv',
			readingFrequency: '23 minutes',
			area: 10,
			areaUnit: 'feet',
			deleteFile: true
		},
		{
			name: 'test15MinSin kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'test/db/data/automatedTests/fifteenMinuteFreqTestData.csv',
			readingFrequency: '15 minutes',
			area: 10,
			areaUnit: 'feet',
			deleteFile: true
		},
		{
			name: 'test23MinCos kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'test/db/data/automatedTests/23FreqCosineTestData.csv',
			readingFrequency: '23 minutes',
			area: 10,
			areaUnit: 'feet',
			deleteFile: true
		},
		{
			name: 'testSqSin kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'test/db/data/automatedTests/2.5AmpSineSquaredTestData.csv',
			readingFrequency: '15 minutes',
			area: 10,
			areaUnit: 'feet',
			deleteFile: true
		},
		{
			name: 'testSqCos kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'test/db/data/automatedTests/2.5AmpCosineSquaredTestData.csv',
			readingFrequency: '15 minutes',
			area: 10,
			areaUnit: 'feet',
			deleteFile: true
		},
		{
			name: 'testAmp1Sin kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'test/db/data/automatedTests/15Freq1AmpSineTestData.csv',
			readingFrequency: '15 minutes',
			deleteFile: true
		},
		{
			name: 'testAmp2Sin kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'test/db/data/automatedTests/15Freq2AmpSineTestData.csv',
			readingFrequency: '15 minutes',
			deleteFile: true
		},
		{
			name: 'testAmp3Sin kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'test/db/data/automatedTests/15Freq3AmpSineTestData.csv',
			readingFrequency: '15 minutes',
			deleteFile: true
		},
		{
			name: 'testAmp4Sin kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'test/db/data/automatedTests/15Freq4AmpSineTestData.csv',
			readingFrequency: '15 minutes',
			deleteFile: true
		},
		{
			name: 'testAmp5Sin kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'test/db/data/automatedTests/15Freq5AmpSineTestData.csv',
			readingFrequency: '15 minutes',
			deleteFile: true
		},
		{
			name: 'testAmp6Sin kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'test/db/data/automatedTests/15Freq6AmpSineTestData.csv',
			readingFrequency: '15 minutes',
			deleteFile: true
		},
		{
			name: 'testAmp7Sin kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			file: 'test/db/data/automatedTests/15Freq7AmpSineTestData.csv',
			readingFrequency: '15 minutes',
			deleteFile: true
		}
	];

	// This assumes the insertSpecialMeters has been run.
	// The table contains special groups' data.
	// Don't create groups with of raw type since should not be graphed as a group.
	const specialGroups = [
		['Electric Utility 1-5 + 2-6 kWh', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility kWh 2-6'], []],
		['Electric Utility 1-5 + Natural Gas Dollar Euro', 'euro', true, undefined, 'special group', ['Electric Utility kWh', 'Natural Gas Dollar'], []],
		['Electric Utility 1-5 + 2-6 Dollar', 'US dollar', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility kWh 2-6'], []],
		['Natural Gas Dollar Euro', 'euro', true, undefined, 'special group', ['Natural Gas Dollar'], []],
		['Electric kW + 2-6 kW', 'kW', true, undefined, 'special group', ['Electric kW', 'Electric kW 2-6'], []],
		['Electric Utility 1-5 kWh not displayable', 'kWh', false, undefined, 'special group', ['Electric Utility kWh'], []],
		['SqSin + SqCos kWh', 'kWh', true, undefined, 'special group', ['testSqSin kWh', 'testSqCos kWh'], []],
		['SqSin + SqCos no unit', '', true, undefined, 'special group', ['testSqSin kWh', 'testSqCos kWh'], []],
		['Amp 1 + 5 kWh', 'kWh', true, undefined, 'special group', ['testAmp1Sin kWh', 'testAmp5Sin kWh'], []],
		['Amp 2 + 6 kWh', 'kWh', true, undefined, 'special group', ['testAmp2Sin kWh', 'testAmp6Sin kWh'], []],
		['Amp 3 + 4 kWh', 'kWh', true, undefined, 'special group', ['testAmp3Sin kWh', 'testAmp4Sin kWh'], []],
		['Amp 2 + (1 + 5) kWh', 'kWh', true, undefined, 'special group', ['testAmp2Sin kWh'], ['Amp 1 + 5 kWh']],
		['Amp 3 + 6 + (2 + (1 + 5)) + (3 + 4) kWh', 'kWh', true, undefined, 'special group', ['testAmp3Sin kWh', 'testAmp6Sin kWh'], ['Amp 2 + (1 + 5) kWh', 'Amp 3 + 4 kWh']],
		['Amp 6 + 7 + (1 + 5) + (2 + 6) + (3 + 4) kWh', 'kWh', true, undefined, 'special group', ['testAmp6Sin kWh', 'testAmp7Sin kWh'], ['Amp 2 + 6 kWh', 'Amp 3 + 4 kWh', 'Amp 1 + 5 kWh']]
	];
	console.log("See src/server/data/automatedTestingData.js in insertSpecialUnitsConversionsMetersGroups() to see how to remove the data that is being inserted.\n");
	const conn = getConnection();
	// These should be there after createDB but do it to be safe in case they are not present.
	// It will skip ones that already there.
	await insertStandardUnits(conn);
	await insertStandardConversions(conn);
	// Add items for developer testing.
	await insertSpecialUnits(conn);
	await insertSpecialConversions(conn);
	// Recreate the Cik entries since changed units/conversions.
	// Do now since needed to insert meters with suffix units.
	await redoCik(conn);
	// Generate the mathematical test data needed.
	// TODO The code could be changed to generate the data and use without writing to a file.
	await testData();
	console.log(`Start loading each set of test data into OED meters (${specialMeters.length} files of varying length, may take minutes):`);
	await insertMeters(specialMeters, conn);
	// Recreate the Cik entries since changed meters.
	await redoCik(conn);
	// Refresh the readings since added new ones.
	await refreshAllReadingViews();
	await insertGroups(specialGroups, conn);
}

/*
The following lines can be used to remove all the readings and meters associated with
the test data. This is valuable if you want to run the process again and the
meters and readings already exist. It is okay to run this a second time if some meters
already exist as those will not be touched (but will not update that meter or readings for that meter).
NOTE this removes the meters and readings. You may need to remove dependent groups
before doing this in the web groups page in OED.
Get into postgres terminal inside the database Docker container and then do:
psql -U oed
-- Remove all the readings.
-- Normally gives "DELETE 575320"
delete from readings where meter_id in (select id from meters where name in ('Electric Utility kWh', 'Electric Utility kWh 2-6', 'Electric Utility kWh in BTU', 'Electric Utility kWh in MTon CO₂', 'Electric Utility no unit', 'Electric Utility kWh not displayable', 'Natural Gas BTU', 'Natural Gas BTU in Dollar', 'Natural Gas Dollar', 'Natural Gas Cubic Meters', 'Water Gallon', 'Trash Kg', 'Temp Fahrenheit 0-212', 'Temp Fahrenheit in Celsius', 'Electric kW', 'Electric kW 2-6', 'Water Gallon flow 1-5 per minute', 'test4DaySin kWh', 'test4HourSin kWh', 'test23MinSin kWh', 'test15MinSin kWh', 'test23MinCos kWh', 'testSqSin kWh', 'testSqCos kWh', 'testAmp1Sin kWh', 'testAmp2Sin kWh', 'testAmp3Sin kWh', 'testAmp4Sin kWh', 'testAmp5Sin kWh', 'testAmp6Sin kWh', 'testAmp7Sin kWh'));
-- remove all groups.
-- Normally gives "DELETE 25"
delete from groups_immediate_meters where group_id in (select id from groups where name in ('Electric Utility 1-5 + 2-6 kWh', 'Electric Utility 1-5 + Natural Gas Dollar Euro', 'Electric Utility 1-5 + 2-6 Dollar', 'Natural Gas Dollar Euro', 'Electric kW + 2-6 kW', 'Electric Utility 1-5 kWh not displayable', 'SqSin + SqCos kWh', 'SqSin + SqCos no unit', 'Amp 1 + 5 kWh', 'Amp 2 + 6 kWh', 'Amp 3 + 4 kWh', 'Amp 2 + (1 + 5) kWh', 'Amp 3 + 6 + (2 + (1 + 5)) + (3 + 4) kWh', 'Amp 6 + 7 + (1 + 5) + (2 + 6) + (3 + 4) kWh'));
-- Normally gives "DELETE 6"
delete from groups_immediate_children where parent_id in (select id from groups where name in ('Electric Utility 1-5 + 2-6 kWh', 'Electric Utility 1-5 + Natural Gas Dollar Euro', 'Electric Utility 1-5 + 2-6 Dollar', 'Natural Gas Dollar Euro', 'Electric kW + 2-6 kW', 'Electric Utility 1-5 kWh not displayable', 'SqSin + SqCos kWh', 'SqSin + SqCos no unit', 'Amp 1 + 5 kWh', 'Amp 2 + 6 kWh', 'Amp 3 + 4 kWh', 'Amp 2 + (1 + 5) kWh', 'Amp 3 + 6 + (2 + (1 + 5)) + (3 + 4) kWh', 'Amp 6 + 7 + (1 + 5) + (2 + 6) + (3 + 4) kWh'));
-- Normally gives "DELETE 14"
delete from groups where name in ('Electric Utility 1-5 + 2-6 kWh', 'Electric Utility 1-5 + Natural Gas Dollar Euro', 'Electric Utility 1-5 + 2-6 Dollar', 'Natural Gas Dollar Euro', 'Electric kW + 2-6 kW', 'Electric Utility 1-5 kWh not displayable', 'SqSin + SqCos kWh', 'SqSin + SqCos no unit', 'Amp 1 + 5 kWh', 'Amp 2 + 6 kWh', 'Amp 3 + 4 kWh', 'Amp 2 + (1 + 5) kWh', 'Amp 3 + 6 + (2 + (1 + 5)) + (3 + 4) kWh', 'Amp 6 + 7 + (1 + 5) + (2 + 6) + (3 + 4) kWh');
-- Remove all the meters. Normally gives "DELETE 31"
delete from meters where name in ('Electric Utility kWh', 'Electric Utility kWh 2-6', 'Electric Utility kWh in BTU', 'Electric Utility kWh in MTon CO₂', 'Electric Utility no unit', 'Electric Utility kWh not displayable', 'Natural Gas BTU', 'Natural Gas BTU in Dollar', 'Natural Gas Dollar', 'Natural Gas Cubic Meters', 'Water Gallon', 'Trash Kg', 'Temp Fahrenheit 0-212', 'Temp Fahrenheit in Celsius', 'Electric kW', 'Electric kW 2-6', 'Water Gallon flow 1-5 per minute', 'test4DaySin kWh', 'test4HourSin kWh', 'test23MinSin kWh', 'test15MinSin kWh', 'test23MinCos kWh', 'testSqSin kWh', 'testSqCos kWh', 'testAmp1Sin kWh', 'testAmp2Sin kWh', 'testAmp3Sin kWh', 'testAmp4Sin kWh', 'testAmp5Sin kWh', 'testAmp6Sin kWh', 'testAmp7Sin kWh');
-- remove conversions
-- Normally 22 total
delete from conversions where source_id = (select id from units where name = 'Electric_Utility') and destination_id = (select id from units where name = 'kWh');
delete from conversions where source_id = (select id from units where name = 'kWh') and destination_id = (select id from units where name = '100 w bulb');
delete from conversions where source_id = (select id from units where name = 'Electric_Utility') and destination_id = (select id from units where name = 'US dollar');
delete from conversions where source_id = (select id from units where name = 'Natural_Gas_BTU') and destination_id = (select id from units where name = 'kg CO₂');
delete from conversions where source_id = (select id from units where name = 'Electric_Utility') and destination_id = (select id from units where name = 'kg CO₂');
delete from conversions where source_id = (select id from units where name = 'Natural_Gas_BTU') and destination_id = (select id from units where name = 'BTU');
delete from conversions where source_id = (select id from units where name = 'Natural_Gas_BTU') and destination_id = (select id from units where name = 'euro');
delete from conversions where source_id = (select id from units where name = 'Natural_Gas_M3') and destination_id = (select id from units where name = 'm³ gas');
delete from conversions where source_id = (select id from units where name = 'Natural_Gas_M3') and destination_id = (select id from units where name = 'US dollar');
delete from conversions where source_id = (select id from units where name = 'Water_Gallon') and destination_id = (select id from units where name = 'gallon');
delete from conversions where source_id = (select id from units where name = 'liter') and destination_id = (select id from units where name = 'gallon');
delete from conversions where source_id = (select id from units where name = 'US dollar') and destination_id = (select id from units where name = 'euro');
delete from conversions where source_id = (select id from units where name = 'Natural_Gas_Dollar') and destination_id = (select id from units where name = 'US dollar');
-- next two were auto-created for suffix CO₂
delete from conversions where source_id = (select id from units where name = 'kg CO₂') and destination_id = (select id from units where name = 'kg of CO₂');
delete from conversions where source_id = (select id from units where name = 'kg CO₂') and destination_id = (select id from units where name = 'metric ton of CO₂');
delete from conversions where source_id = (select id from units where name = 'kg CO₂') and destination_id = (select id from units where name = 'kg');
delete from conversions where source_id = (select id from units where name = 'Trash') and destination_id = (select id from units where name = 'kg CO₂');
delete from conversions where source_id = (select id from units where name = 'Trash') and destination_id = (select id from units where name = 'kg');
delete from conversions where source_id = (select id from units where name = 'Temperature_Fahrenheit') and destination_id = (select id from units where name = 'Fahrenheit');
delete from conversions where source_id = (select id from units where name = 'Electric_kW') and destination_id = (select id from units where name = 'kW');
delete from conversions where source_id = (select id from units where name = 'Water_Gallon_Per_Minute') and destination_id = (select id from units where name = 'gallon per minute');
delete from conversions where source_id = (select id from units where name = 'gallon per minute') and destination_id = (select id from units where name = 'liter per hour');
-- remove units; last two were created as part of suffix unit on CO₂
-- normally gives "DELETE 20"
delete from units where name in ('Electric_Utility', 'Natural_Gas_BTU', '100 w bulb', 'Natural_Gas_M3', 'Natural_Gas_Dollar', 'Water_Gallon', 'US dollar', 'US $', 'euro', 'gallon', 'liter', 'kg CO₂', 'Trash', 'Temperature_Fahrenheit', 'kW', 'Electric_kW', 'gallon per minute', 'gallon per minute', 'liter per hour', 'Water_Gallon_Per_Minute', 'kg of CO₂', 'metric ton of CO₂');
-- Quit postgres.
\q
*/

module.exports = {
	generateSineTestingData,
	generateSineSquaredTestingData,
	generateCosineTestingData,
	generateCosineSquaredTestingData,
	generateFourDayTestingData,
	generateFourHourTestingData,
	generateTwentyThreeMinuteTestingData,
	generateFifteenMinuteTestingData,
	generateOneMinuteTestingData,
	generateTestingData,
	generateVariableAmplitudeTestingData,
	insertSpecialUnits,
	insertSpecialConversions,
	insertSpecialUnitsConversionsMetersGroups
};
