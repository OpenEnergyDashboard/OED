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
const { redoCik } = require('../services/graph/redoCik');
const Meter = require('../models/Meter');
const Group = require('../models/Group');
const loadCsvInput = require('../services/pipeline-in-progress/loadCsvInput');
const moment = require('moment');
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
 * Inserts special units into the database.
 */
async function insertSpecialUnits(conn) {
	// The table contains special units' data.
	// Each row contains: name, identifier, unitRepresentType, typeOfUnit, suffix, displayable, preferredDisplay.
	const specialUnits = [
		['Electric_utility', '', Unit.unitRepresentType.QUANTITY, Unit.unitType.METER, '', Unit.displayableType.NONE, false],
		['Natural_Gas_BTU', '', Unit.unitRepresentType.QUANTITY, Unit.unitType.METER, '', Unit.displayableType.NONE, false],
		['100 W bulb', '100 W bulb for 10 hrs', Unit.unitRepresentType.QUANTITY, Unit.unitType.UNIT, '', Unit.displayableType.ALL, false],
		['Natural_Gas_M3', '', Unit.unitRepresentType.QUANTITY, Unit.unitType.METER, '', Unit.displayableType.NONE, false],
		['Natural_Gas_dollar', '', Unit.unitRepresentType.QUANTITY, Unit.unitType.METER, '', Unit.displayableType.NONE, false],
		['US_dollar', 'US $', Unit.unitRepresentType.QUANTITY, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true],
		['Euro', '€', Unit.unitRepresentType.QUANTITY, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true],
		['kg CO2', 'kg CO2', Unit.unitRepresentType.QUANTITY, Unit.unitType.UNIT, 'CO2', Unit.displayableType.ALL, false],
		['Trash', '', Unit.unitRepresentType.QUANTITY, Unit.unitType.METER, '', Unit.displayableType.NONE, false],
		['Temperature_fahrenheit', '', Unit.unitRepresentType.RAW, Unit.unitType.METER, '', Unit.displayableType.NONE, false],
		['kW', 'kW', Unit.unitRepresentType.FLOW, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true],
		['Electric_kW', '', Unit.unitRepresentType.FLOW, Unit.unitType.METER, '', Unit.displayableType.NONE, false]
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
async function insertSpecialConversions(conn) {
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
		['Trash', 'kg', false, 1, 0, 'Trash → kg'],
		['Temperature_fahrenheit', 'Fahrenheit', false, 1, 0, 'Temperature Fahrenheit → Fahrenheit'],
		['Electric_kW', 'kW', false, 1, 0, 'Electric kW → kW']
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
 * Generate mathematical test data.
 */
async function testData() {
	console.log("Start generating first set of test data (square, varying freq of readings: 7 files):");
	await generateTestingData();
	console.log("Start generating second set of test data (varying amplitudes: 7 files):")
	await generateVariableAmplitudeTestingData();
}

/**
 * Insert special meters into the database.
 */
async function insertSpecialMeters(conn) {
	// The table contains special meters' data.
	// Each row contains: meter name, unit name, default graphic unit name, displayable, CSV reading data filename, whether to delete csv file.
	// Should only delete automatically generated ones.
	// Don't check cases of no default graphic unit since it is set to unit_id for meters.
	const specialMeters = [
		['Electric Utility kWh', 'Electric_utility', 'kWh', true, 'data/unit/quantity1-5.csv', false],
		['Electric Utility kWh 2-6', 'Electric_utility', 'kWh', true, 'data/unit/quantity2-6.csv', false],
		['Electric Utility kWh in BTU', 'Electric_utility', 'BTU', true, 'data/unit/quantity1-5.csv', false],
		['Electric Utility kWh in MTon CO2', 'Electric_utility', 'Metric_ton of CO2', true, 'data/unit/quantity1-5.csv', false],
		['Electric Utility no unit', '', '', true, 'data/unit/quantity1-5.csv', false],
		['Electric Utility kWh not displayable', 'Electric_utility', 'kWh', false, 'data/unit/quantity1-5.csv', false],
		['Natural Gas BTU', 'Natural_Gas_BTU', 'BTU', true, 'data/unit/quantity1-5.csv', false],
		['Natural Gas BTU in Dollar', 'Natural_Gas_BTU', 'US_dollar', true, 'data/unit/quantity1-5.csv', false],
		['Natural Gas Dollar', 'Natural_Gas_dollar', 'US_dollar', true, 'data/unit/quantity1-5.csv', false],
		['Natural Gas Cubic Meters', 'Natural_Gas_M3', 'M3_gas', true, 'data/unit/quantity1-5.csv', false],
		['Trash Kg', 'Trash', 'kg', true, 'data/unit/quantity1-5.csv', false],
		['Temp Fahrenheit 0-212', 'Temperature_fahrenheit', 'Fahrenheit', true, 'data/unit/temp0-212.csv', false],
		['Temp Fahrenheit in Celsius', 'Temperature_fahrenheit', 'Celsius', true, 'data/unit/temp0-212.csv', false],
		['Electric kW', 'Electric_kW', 'kW', true, 'data/unit/rate1-5.csv', false],
		['Electric kW 2-6', 'Electric_kW', 'kW', true, 'data/unit/rate2-6.csv', false],
		['test4DaySin kWh', 'Electric_utility', 'kWh', true, 'test/db/data/automatedTests/fourDayFreqTestData.csv', true],
		['test4HourSin kWh', 'Electric_utility', 'kWh', true, 'test/db/data/automatedTests/fourHourFreqTestData.csv', true],
		['test23MinSin kWh', 'Electric_utility', 'kWh', true, 'test/db/data/automatedTests/twentyThreeMinuteFreqTestData.csv', true],
		['test15MinSin kWh', 'Electric_utility', 'kWh', true, 'test/db/data/automatedTests/fifteenMinuteFreqTestData.csv', true],
		['test23MinCos kWh', 'Electric_utility', 'kWh', true, 'test/db/data/automatedTests/23FreqCosineTestData.csv', true],
		['testSqSin kWh', 'Electric_utility', 'kWh', true, 'test/db/data/automatedTests/2.5AmpSineSquaredTestData.csv', true],
		['testSqCos kWh', 'Electric_utility', 'kWh', true, 'test/db/data/automatedTests/2.5AmpCosineSquaredTestData.csv', true],
		['testAmp1Sin kWh', 'Electric_utility', 'kWh', true, 'test/db/data/automatedTests/15Freq1AmpSineTestData.csv', true],
		['testAmp2Sin kWh', 'Electric_utility', 'kWh', true, 'test/db/data/automatedTests/15Freq2AmpSineTestData.csv', true],
		['testAmp3Sin kWh', 'Electric_utility', 'kWh', true, 'test/db/data/automatedTests/15Freq3AmpSineTestData.csv', true],
		['testAmp4Sin kWh', 'Electric_utility', 'kWh', true, 'test/db/data/automatedTests/15Freq4AmpSineTestData.csv', true],
		['testAmp5Sin kWh', 'Electric_utility', 'kWh', true, 'test/db/data/automatedTests/15Freq5AmpSineTestData.csv', true],
		['testAmp6Sin kWh', 'Electric_utility', 'kWh', true, 'test/db/data/automatedTests/15Freq6AmpSineTestData.csv', true],
		['testAmp7Sin kWh', 'Electric_utility', 'kWh', true, 'test/db/data/automatedTests/15Freq7AmpSineTestData.csv', true]
	];
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

	// Generate the mathematical test data needed.
	// TODO The code could be changed to generate the data and use without writing to a file.
	await testData();

	console.log(`Start loading each set of test data into OED (${specialMeters.length} files of varying length, may take minutes):`);
	for (let i = 0; i < specialMeters.length; ++i) {
		// Meter values from above.
		const meterData = specialMeters[i];
		const meterName = meterData[0];
		console.log(`    loading meter ${meterName} from file ${meterData[4]}`);
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
			undefined, // gps
			undefined, // identifier
			null, // note
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
			meterUnit, // unit
			meterGraphicUnit // default graphic unit
		);
		if (await meter.existsByName(conn)) {
			console.log(`Warning: meter '${meter.name}' existed so not changed.`);
		} else {
			// Only insert the meter and its readings if the meter did not already exist.
			await meter.insert(conn);
			const filename = `src/server/${meterData[4]}`;
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
			// Delete mathematical test data file just uploaded. They have true for delete.
			if (meterData[5] === true) {
				await fs.unlink(filename);
			}
		}
	}
}

/**
 * Insert special groups into the database.
 */
async function insertSpecialGroups(conn) {
	// This assumes the insertSpecialMeters has been run.
	// The table contains special groups' data.
	// Each row contains: group name, default graphic unit name, displayable, array of meter names to add to group, array of group names to add to group.
	// Don't create groups with of raw type since should not be graphed as a group.
	const specialGroups = [
		['Electric Utility 1-5 + 2-6 kWh', 'kWh', true, ['Electric Utility kWh', 'Electric Utility kWh 2-6'], []],
		['Electric Utility 1-5 + Natural Gas Dollar Euro', 'Euro', true, ['Electric Utility kWh', 'Natural Gas Dollar'], []],
		['Electric kW + 2-6 kW', 'kW', true, ['Electric kW', 'Electric kW 2-6'], []],
		['Electric Utility 1-5 kWh not displayable', 'kWh', false, ['Electric Utility kWh'], []],
		['SqSin + SqCos kWh', 'kWh', true, ['testSqSin kWh', 'testSqCos kWh'], []],
		['SqSin + SqCos no unit', '', true, ['testSqSin kWh', 'testSqCos kWh'], []],
		['Amp 1 + 5 kWh', 'kWh', true, ['testAmp1Sin kWh', 'testAmp5Sin kWh'], []],
		['Amp 2 + 6 kWh', 'kWh', true, ['testAmp2Sin kWh', 'testAmp6Sin kWh'], []],
		['Amp 3 + 4 kWh', 'kWh', true, ['testAmp3Sin kWh', 'testAmp4Sin kWh'], []],
		['Amp  2 + (1 + 5) kWh', 'kWh', true, ['testAmp2Sin kWh'], ['Amp 1 + 5 kWh']],
		['Amp 3 + 6 + (2 + (1 + 5)) + (3 + 4) kWh', 'kWh', true, ['testAmp3Sin kWh', 'testAmp6Sin kWh'], ['Amp  2 + (1 + 5) kWh', 'Amp 3 + 4 kWh']],
		['Amp 6 + 7 + (1 + 5) + (2 + 6) + (3 + 4) kWh', 'kWh', true, ['testAmp6Sin kWh', 'testAmp7Sin kWh'], ['Amp 2 + 6 kWh', 'Amp 3 + 4 kWh', 'Amp 1 + 5 kWh']]
	];
	for (let i = 0; i < specialGroups.length; ++i) {
		// Group values from above.
		const groupData = specialGroups[i];
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
			undefined, // gps
			null, // note
			null, //area
			groupDefaultGraphicUnit // default graphic unit
		);
		if (await group.existsByName(conn)) {
			console.log(`Warning: group '${group.name}' existed so not changed.`);
		} else {
			// Only insert the group and its children if the group did not already exist.
			await group.insert(conn);
			// Get it again so have id.
			const parent = await Group.getByName(group.name, conn);
			// Now add the meter children.
			for (let k = 0; k < groupData[3].length; ++k) {
				const childMeter = groupData[3][k];
				console.log(`      adding child meter ${childMeter}`);
				// Use meter id to add to group.
				const childId = (await Meter.getByName(childMeter, conn)).id;
				await parent.adoptMeter(childId, conn);
			}
			// Now add the group children.
			for (let k = 0; k < groupData[4].length; ++k) {
				const childGroup = groupData[4][k];
				console.log(`      adding child group ${childGroup}`);
				// Use group id to add to group.
				const childId = (await Group.getByName(childGroup, conn)).id;
				await parent.adoptGroup(childId, conn);
			}
		}
	}
}

/**
 * Call the functions to insert special units, conversions and meters.
 */
async function insertSpecialUnitsConversionsMeters() {
	console.log("See src/server/data/automatedTestingData.js in insertSpecialUnitsConversionsMeters() to see how to remove the data that is being inserted.\n");
	const conn = getConnection();
	await insertSpecialUnits(conn);
	await insertSpecialConversions(conn);
	// Recreate the Cik entries since changed units/conversions.
	// Do now since needed to insert meters with suffix units.
	await redoCik(conn);
	await insertSpecialMeters(conn);
	// Recreate the Cik entries since changed meters.
	await redoCik(conn);
	// Refresh the readings since added new ones.
	await refreshAllReadingViews();
	insertSpecialGroups(conn);
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
-- Remove all the readings. Normally gives "DELETE 575301"
delete from readings where meter_id in (select id from meters where name in ('Electric Utility kWh', 'Electric Utility kWh 2-6', 'Electric Utility kWh in BTU', 'Electric Utility kWh in MTon CO2', 'Electric Utility no unit', 'Natural Gas BTU', 'Natural Gas BTU in Dollar', 'Natural Gas Dollar', 'Natural Gas Cubic Meters', 'Trash Kg', 'Temp Fahrenheit 0-212', 'Temp Fahrenheit in Celsius', 'Electric kW', 'Electric kW 2-6', 'test4DaySin kWh', 'test4HourSin kWh', 'test23MinSin kWh', 'test15MinSin kWh', 'test23MinCos kWh', 'testSqSin kWh', 'testSqCos kWh', 'testAmp1Sin kWh', 'testAmp2Sin kWh', 'testAmp3Sin kWh', 'testAmp4Sin kWh', 'testAmp5Sin kWh', 'testAmp6Sin kWh', 'testAmp7Sin kWh'));
# remove all groups.
# Normally gives "DELETE 21"
delete from groups_immediate_meters where group_id in (select id from groups where name in ('Electric Utility 1-5 + 2-6 kWh', 'Electric Utility 1-5 + Natural Gas Dollar Euro', 'Electric kW + 2-6 kW', 'SqSin + SqCos kWh', 'SqSin + SqCos no unit', 'Amp 1 + 5 kWh', 'Amp 2 + 6 kWh', 'Amp 3 + 4 kWh', 'Amp  2 + (1 + 5) kWh', 'Amp 3 + 6 + (2 + (1 + 5)) + (3 + 4) kWh', 'Amp 6 + 7 + (1 + 5) + (2 + 6) + (3 + 4) kWh'));
# Normally gives "DELETE 6"
delete from groups_immediate_children where parent_id in (select id from groups where name in ('Electric Utility 1-5 + 2-6 kWh', 'Electric Utility 1-5 + Natural Gas Dollar Euro', 'Electric kW + 2-6 kW', 'SqSin + SqCos kWh', 'SqSin + SqCos no unit', 'Amp 1 + 5 kWh', 'Amp 2 + 6 kWh', 'Amp 3 + 4 kWh', 'Amp  2 + (1 + 5) kWh', 'Amp 3 + 6 + (2 + (1 + 5)) + (3 + 4) kWh', 'Amp 6 + 7 + (1 + 5) + (2 + 6) + (3 + 4) kWh'));
# Normally gives "DELETE 11"
delete from groups where name in ('Electric Utility 1-5 + 2-6 kWh', 'Electric Utility 1-5 + Natural Gas Dollar Euro', 'Electric kW + 2-6 kW', 'SqSin + SqCos kWh', 'SqSin + SqCos no unit', 'Amp 1 + 5 kWh', 'Amp 2 + 6 kWh', 'Amp 3 + 4 kWh', 'Amp  2 + (1 + 5) kWh', 'Amp 3 + 6 + (2 + (1 + 5)) + (3 + 4) kWh', 'Amp 6 + 7 + (1 + 5) + (2 + 6) + (3 + 4) kWh');
# Remove all the meters. Normally gives "DELETE 28"
delete from meters where name in ('Electric Utility kWh', 'Electric Utility kWh 2-6', 'Electric Utility kWh in BTU', 'Electric Utility kWh in MTon CO2', 'Electric Utility no unit', 'Natural Gas BTU', 'Natural Gas BTU in Dollar', 'Natural Gas Dollar', 'Natural Gas Cubic Meters', 'Trash Kg', 'Temp Fahrenheit 0-212', 'Temp Fahrenheit in Celsius', 'Electric kW', 'Electric kW 2-6', 'test4DaySin kWh', 'test4HourSin kWh', 'test23MinSin kWh', 'test15MinSin kWh', 'test23MinCos kWh', 'testSqSin kWh', 'testSqCos kWh', 'testAmp1Sin kWh', 'testAmp2Sin kWh', 'testAmp3Sin kWh', 'testAmp4Sin kWh', 'testAmp5Sin kWh', 'testAmp6Sin kWh', 'testAmp7Sin kWh');
# Quit postgres.
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
	insertSpecialUnitsConversionsMeters,
	insertSpecialUnits,
	insertSpecialConversions,
	insertSpecialMeters
};
