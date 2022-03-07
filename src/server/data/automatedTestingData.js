/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This file contains a series of functions used to generate (at some point automated - hopefully) test data.
 */

const promisify = require('es6-promisify');
const csv = require('csv');
const parseCsv = promisify(csv.parse);
const { generateSine, generateCosine } = require('./generateTestingData');
const Unit = require('../models/Unit');
const Conversion = require('../models/Conversion');
const { getConnection } = require('../db');

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
function generateTestingData() {
	// Generates 1 year of sinusoidal data with data points at 4-day intervals
	generateFourDayTestingData();

	// Generates 1 year of sinusoidal data with data points at 4-hour intervals
	generateFourHourTestingData();

	// Generates 1 year of sinusoidal data with data points at 23-minute intervals
	generateTwentyThreeMinuteTestingData();

	// Generates 1 year of sinusoidal data with data points at 15-minute intervals
	generateFifteenMinuteTestingData();

	// Generates 1 year of sinusoidal data with data points at 1-minute intervals.
	// Normally not desired so commented out.
	// generateOneMinuteTestingData();

	// Generates 1 year of cosinusoidal data with an amplitude of 3 and with data points at 23-minute intervals.
	// Should be related to 23-minute sinusoidal above.
	generateCosineTestingData(23, 3);

	// Generates 2 years of *squared* sinusoidal data with an amplitude of 2.5 and with data points at 1-day intervals.
	generateSineSquaredTestingData(2.5);

	// Generates 2 years of *squared* cosinusoidal data with an amplitude of 2.5 and with data points at 1-day intervals.
	generateCosineSquaredTestingData(2.5);
}

/**
 * Generates 7 files, all containing 2 years of sinusoidal data, and each with a unique amplitude between 1 and 7. More specifically,
 * the first file contains sine waves with an amplitude of 1, the second contains waves with an amplitude of 2, and so on until
 * the seventh which contains waves an amplitude of 7.
 */
function generateVariableAmplitudeTestingData() {
	for (var i = 1; i <= 7; i++) {
		generateSineTestingData(15, i);
	}
}

/**
 * Inserts special units into the database.
 */
async function insertSpecialUnits() {
	const conn = getConnection();
	// The table contains special units' data.
	// Each row contains: name, identifier, unitRepresentType, typeOfUnit, suffix, displayable, preferredDisplay.
	const specialUnits = [
		['Electric_utility', '', Unit.unitRepresentType.QUANTITY, Unit.unitType.METER, '', Unit.displayableType.NONE, false],
		['Natural_Gas_BTU', '', Unit.unitRepresentType.QUANTITY, Unit.unitType.METER, '', Unit.displayableType.NONE, false],
		['100 W bulb', '100 W bulb for 10 hrs', Unit.unitRepresentType.UNUSED, Unit.unitType.UNIT, '', Unit.displayableType.ALL, false],
		['Natural_Gas_M3', '', Unit.unitRepresentType.QUANTITY, Unit.unitType.METER, '', Unit.displayableType.NONE, false],
		['Natural_Gas_dollar', '', Unit.unitRepresentType.QUANTITY, Unit.unitType.METER, '', Unit.displayableType.NONE, false],
		['US_dollar', 'US $', Unit.unitRepresentType.UNUSED, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true],
		['Euro', '€', Unit.unitRepresentType.UNUSED, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true],
		['kg CO2', 'kg CO2', Unit.unitRepresentType.UNUSED, Unit.unitType.UNIT, 'CO2', Unit.displayableType.ALL, false],
		['Trash', '', Unit.unitRepresentType.QUANTITY, Unit.unitType.METER, '', Unit.displayableType.NONE, false]
	];

	for (let i = 0; i < specialUnits.length; ++i) {
		const unitData = specialUnits[i];
		if (await Unit.getByName(unitData[0], conn) === null) {
			await new Unit(undefined, unitData[0], unitData[1], unitData[2], undefined, 
				unitData[3], null, unitData[4], unitData[5], unitData[6], 'special unit').insert(conn);
		}
	}
}

/**
 * Insert special conversions into the database.
 */
async function insertSpecialConversions() {
	const conn = getConnection();
	// The table contains special conversions' data.
	// Each row contains: sourceName, destinationName, bidirectional, slope, intercept, note.
	const specialConversions = [
		['kWh', '100 W bulb', false, 1, 0, 'kWh → 100 W bulb for 10 hrs'],
		['Electric_utility', 'kWh', false, 1, 0, 'Electric Utility → kWh'],
		['Electric_utility', 'US_dollar', false, 0.115, 0, 'Electric Utility → US dollar'],
		['Electric_utility', 'kg CO2', false, 0.709, 0, 'Electric Utility → CO2'],
		['Natural_Gas_BTU', 'BTU', false, 1, 0, 'Natural Gas BTU → BTU'],
		['Natural_Gas_BTU', 'Euro', false, 2.6e-6, 0, 'Natural Gas BTU → Euro'],
		['Natural_Gas_BTU', 'kg CO2', false, 5.28e-5, 0, 'Natural Gas BTU → CO2'],
		['Natural_Gas_M3', 'M3_gas', false, 1, 0, 'Natural Gas M3 → M3 of gas'],
		['Natural_Gas_M3', 'US_dollar', false, 0.11, 0, 'Natural Gas M3 → US dollar'],
		['US_dollar', 'Euro', true, 0.88, 0, 'US dollar → Euro'],
		['Natural_Gas_dollar', 'US_dollar', false, 1, 0, 'Natural Gas $ → US dollar'],
		['kg CO2', 'kg', false, 1, 0, 'CO2 → kg'],
		['Trash', 'kg CO2', false, 3.24e-6, 0, 'Trash → CO2'],
		['Trash', 'kg', false, 1, 0, 'Trash → kg']
	];

	for (let i = 0; i < specialConversions.length; ++i) {
		const conversionData = specialConversions[i];
		const sourceId = (await Unit.getByName(conversionData[0], conn)).id;
		const destinationId = (await Unit.getByName(conversionData[1], conn)).id;
		if (await Conversion.getBySourceDestination(sourceId, destinationId, conn) === null) {
			await new Conversion(sourceId, destinationId, conversionData[2], conversionData[3], conversionData[4], conversionData[5]).insert(conn);
		}
	}
}

/**
 * Call the functions to insert special units and conversions.
 */
async function insertSpecialUnitsAndConversions() {
	await insertSpecialUnits();
	await insertSpecialConversions();
}

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
	insertSpecialUnitsAndConversions
};
