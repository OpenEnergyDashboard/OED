/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This file contains a series of functions used to generate test data.
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
 * Stores the generated data in a meterData object and calls insertMeters to
 * insert the data into the database. Only works for single meter.
 * @param {string} startDate - This is the start time of the data generation; its format needs to be 'YYYY-MM-DD HH:MM:SS'
 * @param {string} endDate - This is the end time of the data generation; it needs to have the format 'YYYY-MM-DD HH:MM:SS'
 * and may not be included. Check the generateDates function for more details.
 * @param {object?} options - The parameters for generating a data for OED
 * @param {boolean} doCosine True if the data should be cosine function, sine otherwise
 * @param {[{}]} meterData key:value pairs of meter values in array with entry for one meter
 * @param {*} conn database connection to use
 */
async function insertData(startDate, endDate, options, doCosine, meterData, conn) {
	// Instead of writing to a file store the data in a variable
	// Store generatedData in meterData object
	console.log(`          generating data for meter ${meterData[0].name}`);
	if (doCosine) {
		// Want cosine data
		meterData[0].data = generateCosine(startDate, endDate, options);
	} else {
		meterData[0].data = generateSine(startDate, endDate, options);
	}
	// Call insertMeters to insert meter data into the database
	await insertMeters(meterData, getConnection());
}

/**
 * Generates sinusoidal testing data over a two year period (2020 to 2021, inclusive)
 * with a 45 day sine period with normalized by hour values.
 * @param {number} [frequency=15] desired frequency of the sinusoidal test data (in minutes).
 * @param {number} [amplitude=1] desired amplitude of the sinusoidal test data.
 * @return {[number, string, string][]} Matrix of rows representing each data row of the form startDate, endDate, options.
 */
function generateSineTestingData(frequency = 15, amplitude = 1) {
	const startDate = DEFAULT_OPTIONS.startDate;
	const endDate = DEFAULT_OPTIONS.endDateTwoYr;
	const options = {
		timeStep: { minute: frequency },
		periodLength: DEFAULT_OPTIONS.periodLength,
		maxAmplitude: amplitude,
		normalize: true
	};
	// Store data in a variable
	const generatedData = generateSine(startDate, endDate, options);
	// Return the generatedData in the function
	return generatedData;
}

/**
 * Generates squared sinusoidal testing data over a one year period (2020)
 * with a 45 day sine period, normalized by hour values with a point each day
 * and places in DB.
 */
async function generateSineSquaredTestingData(amplitude = 1) {
	const startDate = DEFAULT_OPTIONS.startDate;
	const endDate = DEFAULT_OPTIONS.endDateOneYr;
	const meterData = [
		{
			name: 'Sin Sq kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			// Instead of filepath store generatedData in variable
			data: [],
			readingFrequency: '15 minutes',
			area: 10,
			areaUnit: 'feet',
		},
	]
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
		squared: true // Option set to true because want sine *squared* data.
	};
	// Puts the values into the database rather than saving to a file
	await insertData(startDate, endDate, options, false, meterData, getConnection())
}

/**
 * Generates cosinusoidal testing data over a one year period (2020)
 * with a 45 day sine period with normalized by hour values and places in DB.
 * @param {number} [frequency=15] - desired frequency of the cosinusoidal test data (in minutes).
 * @param {number} [amplitude=1] - desired amplitude of the cosinusoidal test data.
 */
async function generateCosineTestingData(frequency = 15, amplitude = 1) {
	const startDate = DEFAULT_OPTIONS.startDate;
	const endDate = DEFAULT_OPTIONS.endDateOneYr;
	const meterData = [
		{
			name: 'Cos 23 Min kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			// Instead of filepath store generatedData in variable
			data: [],
			readingFrequency: '23 minutes',
			area: 10,
			areaUnit: 'feet',
		},
	]
	const options = {
		timeStep: { minute: frequency },
		periodLength: DEFAULT_OPTIONS.periodLength,
		maxAmplitude: amplitude,
	};
	// Puts the values into the database rather than saving to a file
	await insertData(startDate, endDate, options, true, meterData, getConnection())
}

/**
 * Generates squared cosinusoidal testing data over a one year period (2020)
 * with a 45 day cosine period with normalized by hour values and places in DB.
 * @param {number} [amplitude=1] - desired amplitude of the squared cosinusoidal test data.
 */
async function generateCosineSquaredTestingData(amplitude = 1) {
	const startDate = DEFAULT_OPTIONS.startDate;
	const endDate = DEFAULT_OPTIONS.endDateOneYr;
	const meterData = [
		{
			name: 'Cos Sq kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			// Instead of filepath store generatedData in variable
			data: [],
			readingFrequency: '15 minutes',
			area: 10,
			areaUnit: 'feet',
		},
	]
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
		squared: true // Option set to true because want cosine *squared* data.
	};
	// Puts the values into the database rather than saving to a file
	await insertData(startDate, endDate, options, true, meterData, getConnection());
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
 * with a 45 day sine period and amplitude 3 with normalized by hour values and places in DB.
 */
async function generateFourDayTestingData() {
	const startDate = DEFAULT_OPTIONS.startDate;
	const endDate = DEFAULT_OPTIONS.endDateOneYr;
	const meterData = [
		{
			name: 'Sin 4 Day kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			// Instead of filepath store generatedData in variable
			data: [],
			readingFrequency: '4 days',
			area: 10,
			areaUnit: 'feet',
		}
	];
	const options = {
		timeStep: { day: 4 },
		periodLength: DEFAULT_OPTIONS.periodLength,
		maxAmplitude: 3,
	};
	// Puts the values into the database rather than saving to a file
	return await insertData(startDate, endDate, options, false, meterData, getConnection());
}

/**
 * Generates one year of sinusoidal testing data (for the whole year of 2020) at 4 hour intervals
 * with a 45 day sine period and amplitude 3 with normalized by hour values and places in DB.
 */
async function generateFourHourTestingData() {
	const startDate = DEFAULT_OPTIONS.startDate;
	const endDate = DEFAULT_OPTIONS.endDateOneYr;
	const meterData = [
		{
			name: 'Sin 4 Hour kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			// Store data in variable instead of filepath
			data: [],
			// Some points less than 1 day but this is what is typical.
			readingFrequency: '4 hours',
			area: 10,
			areaUnit: 'feet',
		}
	];
	const options = {
		// Data point intervals set to 240 minutes = 4 hours.
		timeStep: { hour: 4 },
		periodLength: DEFAULT_OPTIONS.periodLength,
		maxAmplitude: 3,
	};
	// Puts the values into the database rather than saving to a file
	return await insertData(startDate, endDate, options, false, meterData, getConnection());
}

/**
 * Generates one year of sinusoidal testing data (for the whole year of 2020) at 23 minute intervals
 * with a 45 day sine period and amplitude 3 with normalized by hour values and places in DB.
 */
async function generateTwentyThreeMinuteTestingData() {
	const startDate = DEFAULT_OPTIONS.startDate;
	const endDate = DEFAULT_OPTIONS.endDateOneYr;
	const meterData = [
		{
			name: 'Sin 23 Min kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			// Store data in variable instead of filepath
			data: [],
			readingFrequency: '23 minutes',
			area: 10,
			areaUnit: 'feet',
		},

	]
	const options = {
		timeStep: { minute: 23 }, // Data point intervals set to 23 minutes.
		periodLength: DEFAULT_OPTIONS.periodLength,
		maxAmplitude: 3,
	};
	// Puts the values into the database rather than saving to a file
	await insertData(startDate, endDate, options, false, meterData, getConnection());
}

/**
 * Generates one year of sinusoidal testing data (for the whole year of 2020) at 15 minute intervals
 * with a 45 day sine period and amplitude 3 with normalized by hour values and places in DB.
 */
async function generateFifteenMinuteTestingData() {
	const startDate = DEFAULT_OPTIONS.startDate;
	const endDate = DEFAULT_OPTIONS.endDateOneYr;
	const meterData = [
		{
			name: 'Sin 15 Min kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			// Store data in variable instead of filepath
			data: [],
			readingFrequency: '15 minutes',
			area: 10,
			areaUnit: 'feet',
		},
	]
	const options = {
		timeStep: { minute: 15 }, // Data point intervals set to 15 minutes.
		periodLength: DEFAULT_OPTIONS.periodLength,
		maxAmplitude: 3,
	};
	// Puts the values into the database rather than saving to a file
	await insertData(startDate, endDate, options, false, meterData, getConnection());
}

/**
 * Generates one year of sinusoidal testing data (for the whole year of 2020) at 1 minute intervals
 * with a 45 day sine period and amplitude 3 with normalized by hour values and places in DB.
 */
async function generateOneMinuteTestingData() {
	const startDate = DEFAULT_OPTIONS.startDate;
	const endDate = DEFAULT_OPTIONS.endDateOneYr;
	const meterData = [
		{
			name: 'Sin 1 Min kWh',
			unit: 'Electric_Utility',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: undefined,
			note: 'special meter',
			// Store data in variable instead of filepath
			data: [],
			readingFrequency: '1 minute',
			area: 10,
			areaUnit: 'feet',
		},
	]
	const options = {
		timeStep: { minute: 1 }, // Data point intervals set to 1 minute.
		periodLength: DEFAULT_OPTIONS.periodLength,
		maxAmplitude: 3,
	};
	// Puts the values into the database rather than saving to a file
	await insertData(startDate, endDate, options, false, meterData, getConnection());
}

/**
 * Calls the above functions with appropriate parameters to generate all the necessary testing data.
 * @returns Promise holding array of promises with promise from each set of data inserted into DB.
 */
async function generateTestingData() {
	// Array to hold all promises from all generation data calls.
	const generatePromises = [];

	// Generates 1 year of sinusoidal data with data points at 4-day intervals
	generatePromises.push(generateFourDayTestingData());

	// Generates 1 year of sinusoidal data with data points at 4-hour intervals
	generatePromises.push(generateFourHourTestingData());

	// Generates 1 year of sinusoidal data with data points at 23-minute intervals
	generatePromises.push(generateTwentyThreeMinuteTestingData());

	// Generates 1 year of sinusoidal data with data points at 15-minute intervals
	generatePromises.push(generateFifteenMinuteTestingData())

	// Generates 1 year of sinusoidal data with data points at 1-minute intervals.
	// Normally not desired so commented out.
	// generateOneMinuteTestingData();

	// Generates 1 year of cosinusoidal data with an amplitude of 3 and with data points at 23-minute intervals.
	// Should be related to 23-minute sinusoidal above.
	generatePromises.push(generateCosineTestingData(23, 3))

	// Generates 2 years of *squared* sinusoidal data with an amplitude of 2.5 and with data points at 1-day intervals.
	generatePromises.push(generateSineSquaredTestingData(2.5))

	// Generates 2 years of *squared* cosinusoidal data with an amplitude of 2.5 and with data points at 1-day intervals.
	generatePromises.push(generateCosineSquaredTestingData(2.5))

	return generatePromises;
}

/**
 * Inserts into DB three sets of sine data with amplitudes of 1, 2 & 3 with 2 years of sinusoidal data.
 * @returns Promise holding array of promises with promise from each set of data inserted into DB.
 */
async function generateVariableAmplitudeTestingData() {
	const meterData = [];
	//Create the meterData and push each set of data into the array 
	meterData.push({
		name: 'Sin Amp 1 kWh',
		unit: 'Electric_Utility',
		defaultGraphicUnit: 'kWh',
		displayable: true,
		gps: '8.5, 41.6',
		note: 'special meter',
		data: [],
		readingFrequency: '15 minutes',
	});
	meterData.push({
		name: 'Sin Amp 2 kWh',
		unit: 'Electric_Utility',
		defaultGraphicUnit: 'kWh',
		displayable: true,
		gps: '23.4, 42.6',
		note: 'special meter',
		data: [],
		readingFrequency: '15 minutes',
	});
	meterData.push({
		name: 'Sin Amp 3 kWh',
		unit: 'Electric_Utility',
		defaultGraphicUnit: 'kWh',
		displayable: true,
		gps: '25.2, 26.8',
		note: 'special meter',
		data: [],
		readingFrequency: '15 minutes',
	});
	for (var i = 1; i <= 3; i++) {
		console.log(`          generating data for meter ${meterData[i - 1].name}`);
		meterData[i - 1].data = generateSineTestingData(15, i);
	}
	// Add meter with data
	return insertMeters(meterData, getConnection());
}

/**
 * Generate mathematical test data.
 * @returns Promise for when all the inserted data is done.
 */
async function testData() {
	console.log("Start generating first set of test data (square, varying freq of readings: 7 sets):");
	// The result is an array of promises for each dataset inserted into DB.
	// Before the await it is the overall Promise for the function call.
	const generatedResult = await generateTestingData();
	console.log("Start generating second set of test data (varying amplitudes: 3 sets):");
	const ampResult = await generateVariableAmplitudeTestingData();
	// Combine the two results
	allResult = [...generatedResult, ...ampResult];
	// Wrap it up in a single promise.
	return Promise.all(allResult);
}

// This array contains special units data that is used for both dev and web.
// As such, it should only be changed if okay for web data.
const specialUnitsGeneral = [
	// Some units must be redone so visible since not for standard units.
	{
		name: 'BTU',
		identifier: '',
		unitRepresent: Unit.unitRepresentType.QUANTITY,
		secInRate: 3600,
		typeOfUnit: Unit.unitType.UNIT,
		suffix: '',
		displayable: Unit.displayableType.ALL,
		preferredDisplay: true,
		note: 'special unit'
	},
	{
		name: 'm³ gas',
		identifier: '',
		unitRepresent: Unit.unitRepresentType.QUANTITY,
		secInRate: 3600,
		typeOfUnit: Unit.unitType.UNIT,
		suffix: '',
		displayable: Unit.displayableType.ALL,
		preferredDisplay: false,
		note: 'special unit'
	},
	{
		name: 'kg',
		identifier: '',
		unitRepresent: Unit.unitRepresentType.QUANTITY,
		secInRate: 3600,
		typeOfUnit: Unit.unitType.UNIT,
		suffix: '',
		displayable: Unit.displayableType.ALL,
		preferredDisplay: false,
		note: 'special unit'
	},
	{
		name: 'metric ton',
		identifier: '',
		unitRepresent: Unit.unitRepresentType.QUANTITY,
		secInRate: 3600,
		typeOfUnit: Unit.unitType.UNIT,
		suffix: '',
		displayable: Unit.displayableType.ALL,
		preferredDisplay: false,
		note: 'special unit'
	},
	{
		name: 'gallon',
		identifier: '',
		unitRepresent: Unit.unitRepresentType.QUANTITY,
		secInRate: 3600,
		typeOfUnit: Unit.unitType.UNIT,
		suffix: '',
		displayable: Unit.displayableType.ALL,
		preferredDisplay: true,
		note: 'special unit'
	},
	{
		name: 'liter',
		identifier: '',
		unitRepresent: Unit.unitRepresentType.QUANTITY,
		secInRate: 3600,
		typeOfUnit: Unit.unitType.UNIT,
		suffix: '',
		displayable: Unit.displayableType.ALL,
		preferredDisplay: true,
		note: 'special unit'
	},
	{
		name: 'Fahrenheit',
		identifier: '',
		unitRepresent: Unit.unitRepresentType.RAW,
		secInRate: 3600,
		typeOfUnit: Unit.unitType.UNIT,
		suffix: '',
		displayable: Unit.displayableType.ALL,
		preferredDisplay: false,
		note: 'special unit'
	},
	{
		name: 'Celsius',
		identifier: '',
		unitRepresent: Unit.unitRepresentType.RAW,
		secInRate: 3600,
		typeOfUnit: Unit.unitType.UNIT,
		suffix: '',
		displayable: Unit.displayableType.ALL,
		preferredDisplay: false,
		note: 'special unit'
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
		note: 'special unit'
	},
	{
		name: 'Natural_Gas_BTU',
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
		name: 'Natural_Gas_M3',
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
		name: 'Water_Gallon',
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
		name: 'US dollar',
		identifier: 'US $',
		unitRepresent: Unit.unitRepresentType.QUANTITY,
		secInRate: 3600,
		typeOfUnit: Unit.unitType.UNIT,
		suffix: '',
		displayable: Unit.displayableType.ALL,
		preferredDisplay: true,
		note: 'special unit'
	},
	{
		name: 'kg CO₂',
		identifier: '',
		unitRepresent: Unit.unitRepresentType.QUANTITY,
		secInRate: 3600,
		typeOfUnit: Unit.unitType.UNIT,
		suffix: 'CO₂',
		displayable: Unit.displayableType.ALL,
		preferredDisplay: false,
		note: 'special unit'
	},
	{
		name: 'Temperature_Fahrenheit',
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
		name: 'kW',
		identifier: '',
		unitRepresent: Unit.unitRepresentType.FLOW,
		secInRate: 3600,
		typeOfUnit: Unit.unitType.UNIT,
		suffix: '',
		displayable: Unit.displayableType.ALL,
		preferredDisplay: true,
		note: 'special unit'
	},
	{
		name: 'Electric_kW',
		identifier: '',
		unitRepresent: Unit.unitRepresentType.FLOW,
		secInRate: 3600,
		typeOfUnit: Unit.unitType.METER,
		suffix: '',
		displayable: Unit.displayableType.NONE,
		preferredDisplay: false,
		note: 'special unit'
	},
];

/**
 * Inserts special units into the database.
 */
async function insertSpecialUnits(conn) {
	// Combine the general special units with ones only for dev.
	const specialUnitsDev = specialUnitsGeneral.concat([
		{
			name: 'MJ',
			identifier: 'megaJoules',
			unitRepresent: Unit.unitRepresentType.QUANTITY,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.UNIT,
			suffix: '',
			displayable: Unit.displayableType.ALL,
			preferredDisplay: false,
			note: 'special unit'
		},
		{
			name: '100 w bulb',
			identifier: '100 w bulb for 10 hrs',
			unitRepresent: Unit.unitRepresentType.QUANTITY,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.UNIT,
			suffix: '',
			displayable: Unit.displayableType.ALL,
			preferredDisplay: false,
			note: 'special unit'
		},
		{
			name: 'Natural_Gas_Dollar',
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
			name: 'euro',
			identifier: '€',
			unitRepresent: Unit.unitRepresentType.QUANTITY,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.UNIT,
			suffix: '',
			displayable: Unit.displayableType.ALL,
			preferredDisplay: true,
			note: 'special unit'
		},
		{
			name: 'Trash',
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
			name: 'gallon per minute',
			identifier: 'gallon (rate)',
			unitRepresent: Unit.unitRepresentType.FLOW,
			secInRate: 60,
			typeOfUnit: Unit.unitType.UNIT,
			suffix: '',
			displayable: Unit.displayableType.ALL,
			preferredDisplay: true,
			note: 'special unit'
		},
		{
			name: 'liter per hour',
			identifier: 'liter (rate)',
			unitRepresent: Unit.unitRepresentType.FLOW,
			secInRate: 3600,
			typeOfUnit: Unit.unitType.UNIT,
			suffix: '',
			displayable: Unit.displayableType.ALL,
			preferredDisplay: true,
			note: 'special unit'
		},
		{
			name: 'Water_Gallon_Per_Minute',
			identifier: '',
			unitRepresent: Unit.unitRepresentType.FLOW,
			secInRate: 60,
			typeOfUnit: Unit.unitType.METER,
			suffix: '',
			displayable: Unit.displayableType.NONE,
			preferredDisplay: false,
			note: 'special unit'
		}
	]);

	// For now it updates any units that exist since standard ones are changed for developers. This will wipe out any changes on restart.
	await insertUnits(specialUnitsDev, true, conn);
}

// This array contains special conversions data that is used for both dev and web.
// As such, it should only be changed if okay for web data.
const specialConversionsGeneral = [
	{
		sourceName: 'Electric_Utility',
		destinationName: 'kWh',
		bidirectional: false,
		slope: 1,
		intercept: 0,
		note: 'Electric_Utility → kWh'
	},
	{
		sourceName: 'Electric_Utility',
		destinationName: 'US dollar',
		bidirectional: false,
		slope: 0.115,
		intercept: 0,
		note: 'Electric_Utility → US dollar'
	},
	{
		sourceName: 'Electric_Utility',
		destinationName: 'kg CO₂',
		bidirectional: false,
		slope: 0.709,
		intercept: 0,
		note: 'Electric_Utility → kg CO₂'
	},
	{
		sourceName: 'Natural_Gas_BTU',
		destinationName: 'BTU',
		bidirectional: false,
		slope: 1,
		intercept: 0,
		note: 'Natural_Gas_BTU → BTU'
	},
	{
		sourceName: 'Natural_Gas_BTU',
		destinationName: 'kg CO₂',
		bidirectional: false,
		slope: 5.29e-5,
		intercept: 0,
		note: 'Natural_Gas_BTU → kg CO₂'
	},
	{
		sourceName: 'Natural_Gas_M3',
		destinationName: 'm³ gas',
		bidirectional: false,
		slope: 1,
		intercept: 0,
		note: 'Natural_Gas_M3 → m^3 of gas'
	},
	{
		sourceName: 'Natural_Gas_M3',
		destinationName: 'US dollar',
		bidirectional: false,
		slope: 0.25,
		intercept: 0,
		note: 'Natural_Gas_M3 → US dollar'
	},
	{
		sourceName: 'Water_Gallon',
		destinationName: 'gallon',
		bidirectional: false,
		slope: 1,
		intercept: 0,
		note: 'Water_Gallon → gallon'
	},
	{
		sourceName: 'kg CO₂',
		destinationName: 'kg',
		bidirectional: false,
		slope: 1,
		intercept: 0,
		note: 'CO₂ → kg'
	},
	{
		sourceName: 'Temperature_Fahrenheit',
		destinationName: 'Fahrenheit',
		bidirectional: false,
		slope: 1,
		intercept: 0,
		note: 'Temperature_Fahrenheit → Fahrenheit'
	},
	{
		sourceName: 'Electric_kW',
		destinationName: 'kW',
		bidirectional: false,
		slope: 1,
		intercept: 0,
		note: 'Electric_kW → kW'
	},
];

/**
 * Insert special conversions into the database.
 */
async function insertSpecialConversions(conn) {
	// Combine the general special conversions with ones only for dev.
	const specialConversionsDev = specialConversionsGeneral.concat([
		{
			sourceName: 'kWh',
			destinationName: '100 w bulb',
			bidirectional: false,
			slope: 1,
			intercept: 0,
			note: 'kWh → 100 w bulb'
		},
		{
			sourceName: 'kWh',
			destinationName: 'MJ',
			bidirectional: true,
			slope: 3.6,
			intercept: 0,
			note: 'kWh → MJ'
		},
		{
			sourceName: 'Natural_Gas_BTU',
			destinationName: 'euro',
			bidirectional: false,
			slope: 2.6e-6,
			intercept: 0,
			note: 'Natural_Gas_BTU → euro'
		},
		{
			sourceName: 'US dollar',
			destinationName: 'euro',
			bidirectional: true,
			slope: 0.88,
			intercept: 0,
			note: 'US dollar → euro'
		},
		{
			sourceName: 'Natural_Gas_Dollar',
			destinationName: 'US dollar',
			bidirectional: false,
			slope: 1,
			intercept: 0,
			note: 'Natural_Gas_Dollar → US dollar'
		},
		{
			sourceName: 'Trash',
			destinationName: 'kg CO₂',
			bidirectional: false,
			slope: 3.24e-6,
			intercept: 0,
			note: 'Trash → CO2'
		},
		{
			sourceName: 'Trash',
			destinationName: 'kg',
			bidirectional: false,
			slope: 1,
			intercept: 0,
			note: 'Trash → kg'
		},
		{
			sourceName: 'Water_Gallon_Per_Minute',
			destinationName: 'gallon per minute',
			bidirectional: false,
			slope: 1,
			intercept: 0,
			note: 'Water_Gallon_Per_Minute → gallon per minute'
		},
		{
			sourceName: 'gallon per minute',
			destinationName: 'liter per hour',
			bidirectional: true,
			slope: 227.12398,
			intercept: 0,
			note: 'gallon per minute → liter per hour'
		}
	]);
	await insertConversions(specialConversionsDev, conn);
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
	];

	// This assumes the insertSpecialMeters has been run.
	// The table contains special groups' data.
	// Don't create groups of raw type since could not be graphed as a group.
	const specialGroups = [
		{
			name: 'Electric Utility 1-5 + 2-6 kWh',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			note: 'special group',
			area: 10,
			areaUnit: 'meters',
			childMeters: ['Electric Utility kWh', 'Electric Utility kWh 2-6'],
			childGroups: []
		},
		{
			name: 'Electric Utility 1-5 + Natural Gas Dollar Euro',
			defaultGraphicUnit: 'euro',
			displayable: true,
			note: 'special group',
			areaUnit: 'meters',
			childMeters: ['Electric Utility kWh', 'Natural Gas Dollar'],
			childGroups: []
		},
		{
			name: 'Electric Utility 1-5 + 2-6 Dollar',
			defaultGraphicUnit: 'US dollar',
			displayable: true,
			note: 'special group',
			area: 10,
			areaUnit: 'meters',
			childMeters: ['Electric Utility kWh', 'Electric Utility kWh 2-6'],
			childGroups: []
		},
		{
			name: 'Natural Gas Dollar Euro',
			defaultGraphicUnit: 'euro',
			displayable: true,
			note: 'special group',
			areaUnit: 'meters',
			childMeters: ['Natural Gas Dollar'],
			childGroups: []
		},
		{
			name: 'Electric kW + 2-6 kW',
			defaultGraphicUnit: 'kW',
			displayable: true,
			note: 'special group',
			area: 100,
			areaUnit: 'meters',
			childMeters: ['Electric kW', 'Electric kW 2-6'],
			childGroups: []
		},
		{
			name: 'Electric Utility 1-5 kWh not displayable',
			defaultGraphicUnit: 'kWh',
			displayable: false,
			note: 'special group',
			areaUnit: 'meters',
			childMeters: ['Electric Utility kWh'],
			childGroups: []
		},
		{
			name: 'Sin Sq + Cos Sq kWh',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			note: 'special group',
			area: 10,
			areaUnit: 'meters',
			childMeters: ['Sin Sq kWh', 'Cos Sq kWh'],
			childGroups: []
		},
		{
			name: 'Sin Sq + Cos Sq no unit',
			displayable: true,
			note: 'special group',
			areaUnit: 'meters',
			childMeters: ['Sin Sq kWh', 'Cos Sq kWh'],
			childGroups: []
		},
		{
			name: 'Sin Amp 1 + 2 kWh',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: '8.1, 20.2',
			note: 'special group',
			area: 1000,
			areaUnit: 'meters',
			childMeters: ['Sin Amp 1 kWh', 'Sin Amp 2 kWh'],
			childGroups: []
		},
		{
			name: 'Sin Amp 2 + 3 kWh',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			gps: '18.9, 5.6',
			note: 'special group',
			area: 1000,
			areaUnit: 'meters',
			childMeters: ['Sin Amp 2 kWh', 'Sin Amp 3 kWh'],
			childGroups: []
		},
		{
			name: 'Sin Amp 1 + (2 + 3) kWh',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			note: 'special group',
			area: 10000,
			areaUnit: 'meters',
			childMeters: ['Sin Amp 1 kWh'],
			childGroups: ['Sin Amp 2 + 3 kWh']
		},
		{
			name: 'Sin Amp 1 + 2 + (1 + 2) + (2 + 3) kWh',
			defaultGraphicUnit: 'kWh',
			displayable: true,
			note: 'special group',
			area: 10000,
			areaUnit: 'meters',
			childMeters: ['Sin Amp 1 kWh', 'Sin Amp 2 kWh'],
			childGroups: ['Sin Amp 1 + 2 kWh', 'Sin Amp 2 + 3 kWh']
		},
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
	console.log(`Start loading each set of test data into OED meters, may take minutes):\n`);
	// This is very fast so wait since simpler and easier to see if this part fails.
	await insertMeters(specialMeters, conn);
	// Now do the large dataset generation.
	await testData();
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
TODO These likely need to be updated.
psql -U oed
-- Remove all the readings.
-- Normally gives "DELETE 294616"
delete from readings where meter_id in (select id from meters where name in ('Electric Utility kWh', 'Electric Utility kWh 2-6', 'Electric Utility kWh in BTU', 'Electric Utility kWh in MTon CO₂', 'Electric Utility no unit', 'Electric Utility kWh not displayable', 'Natural Gas BTU', 'Natural Gas BTU in Dollar', 'Natural Gas Dollar', 'Natural Gas Cubic Meters', 'Water Gallon', 'Trash Kg', 'Temp Fahrenheit 0-212', 'Temp Fahrenheit in Celsius', 'Electric kW', 'Electric kW 2-6', 'Water Gallon flow 1-5 per minute', 'test4DaySin kWh', 'test4HourSin kWh', 'test23MinSin kWh', 'test15MinSin kWh', 'test23MinCos kWh', 'testSqSin kWh', 'testSqCos kWh', 'testAmp1Sin kWh', 'testAmp2Sin kWh', 'testAmp3Sin kWh', 'testAmp4Sin kWh', 'testAmp5Sin kWh', 'testAmp6Sin kWh', 'testAmp7Sin kWh'));
-- remove all groups.
-- Normally gives "DELETE 17"
delete from groups_immediate_meters where group_id in (select id from groups where name in ('Electric Utility 1-5 + 2-6 kWh', 'Electric Utility 1-5 + Natural Gas Dollar Euro', 'Electric Utility 1-5 + 2-6 Dollar', 'Natural Gas Dollar Euro', 'Electric kW + 2-6 kW', 'Electric Utility 1-5 kWh not displayable', 'SqSin + SqCos kWh', 'SqSin + SqCos no unit', 'Amp 1 + 5 kWh', 'Amp 2 + 6 kWh', 'Amp 3 + 4 kWh', 'Amp 2 + (1 + 5) kWh', 'Amp 3 + 6 + (2 + (1 + 5)) + (3 + 4) kWh', 'Amp 6 + 7 + (1 + 5) + (2 + 6) + (3 + 4) kWh'));
-- Normally gives "DELETE 3"
delete from groups_immediate_children where parent_id in (select id from groups where name in ('Electric Utility 1-5 + 2-6 kWh', 'Electric Utility 1-5 + Natural Gas Dollar Euro', 'Electric Utility 1-5 + 2-6 Dollar', 'Natural Gas Dollar Euro', 'Electric kW + 2-6 kW', 'Electric Utility 1-5 kWh not displayable', 'SqSin + SqCos kWh', 'SqSin + SqCos no unit', 'Amp 1 + 5 kWh', 'Amp 2 + 6 kWh', 'Amp 3 + 4 kWh', 'Amp 2 + (1 + 5) kWh', 'Amp 3 + 6 + (2 + (1 + 5)) + (3 + 4) kWh', 'Amp 6 + 7 + (1 + 5) + (2 + 6) + (3 + 4) kWh'));
-- Normally gives "DELETE 12"
delete from groups where name in ('Electric Utility 1-5 + 2-6 kWh', 'Electric Utility 1-5 + Natural Gas Dollar Euro', 'Electric Utility 1-5 + 2-6 Dollar', 'Natural Gas Dollar Euro', 'Electric kW + 2-6 kW', 'Electric Utility 1-5 kWh not displayable', 'SqSin + SqCos kWh', 'SqSin + SqCos no unit', 'Amp 1 + 5 kWh', 'Amp 2 + 6 kWh', 'Amp 3 + 4 kWh', 'Amp 2 + (1 + 5) kWh', 'Amp 3 + 6 + (2 + (1 + 5)) + (3 + 4) kWh', 'Amp 6 + 7 + (1 + 5) + (2 + 6) + (3 + 4) kWh');
-- Remove all the meters. Normally gives "DELETE 31"
delete from meters where name in ('Electric Utility kWh', 'Electric Utility kWh 2-6', 'Electric Utility kWh in BTU', 'Electric Utility kWh in MTon CO₂', 'Electric Utility no unit', 'Electric Utility kWh not displayable', 'Natural Gas BTU', 'Natural Gas BTU in Dollar', 'Natural Gas Dollar', 'Natural Gas Cubic Meters', 'Water Gallon', 'Trash Kg', 'Temp Fahrenheit 0-212', 'Temp Fahrenheit in Celsius', 'Electric kW', 'Electric kW 2-6', 'Water Gallon flow 1-5 per minute', 'test4DaySin kWh', 'test4HourSin kWh', 'test23MinSin kWh', 'test15MinSin kWh', 'test23MinCos kWh', 'testSqSin kWh', 'testSqCos kWh', 'testAmp1Sin kWh', 'testAmp2Sin kWh', 'testAmp3Sin kWh', 'testAmp4Sin kWh', 'testAmp5Sin kWh', 'testAmp6Sin kWh', 'testAmp7Sin kWh');
-- remove conversions
-- Normally 27 total
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

If you are sure you don't have any meters, groups or readings that you want then you can do:
delete from readings; delete from groups_immediate_meters; delete from groups_immediate_children; delete from groups; delete from meters;
and if you want to also remove all the conversions and readings:
delete from conversions; delete from cik; delete from units;
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
	insertSpecialUnitsConversionsMetersGroups,
	specialUnitsGeneral,
	specialConversionsGeneral
};
