/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { expect, testDB } = require('../test/common');
const { TimeInterval } = require('../../common/TimeInterval');
const { insertUnits, insertConversions, insertMeters, insertGroups } = require('./insertData');
const Unit = require('../models/Unit');
const { redoCik } = require('../services/graph/redoCik');
const { refreshAllReadingViews } = require('../services/refreshAllReadingViews');
const readCsv = require('../services/pipeline-in-progress/readCsv');
const moment = require('moment');

const ETERNITY = TimeInterval.unbounded();
// Readings should be accurate to many decimal places, but allow some wiggle room for database and javascript conversions
const DELTA = 0.0000001;
// Meter and group IDs when inserting into DB. The actual value should not matter.
const METER_ID = 100;
const GROUP_ID = 200;
// Some common HTTP status response codes
const HTTP_CODE = {
    OK: 200,
    FOUND: 302,
    BAD_REQUEST: 400,
    NOT_FOUND: 404
};

/**
 * Initialize test database, call the functions to insert data into the database,
 * then redoCik and refresh views to ensure everything works.
 * @param {array} unitData parameters for insertUnits
 * @param {array} conversionData parameters for insertConversions
 * @param {array} meterData parameters for insertMeters
 * @param {array} groupData  parameters for insertGroups (optional)
 */
async function prepareTest(unitData, conversionData, meterData, groupData = []) {
    const conn = testDB.getConnection();
    await insertUnits(unitData, false, conn);
    await insertConversions(conversionData, conn);
    const result = await insertMeters(meterData, conn);
    await insertGroups(groupData, conn);
    await redoCik(conn);
    await refreshAllReadingViews();
}

/**
 * Call this function to generate an array of arrays of a csv file.
 * This function will remove the first 'row' from the csv file (typically the column names)
 * @param {string} fileName path to the 'expected values' csv file to correspond with the readings file
 * @returns {array} array of arrays similar in format to the expected JSON output of the readings api
 */
async function parseExpectedCsv(fileName) {
    let expectedCsv = await readCsv(fileName);
    expectedCsv.shift();
    return expectedCsv;
};

/**
 * Compares readings from api call against the expected readings csv
 * @param {request.Response} res the response to the HTTP GET request from Chai
 * @param {array} expected the returned array from parseExpectedCsv
 */
function expectReadingToEqualExpected(res, expected, id = METER_ID) {
    expect(res).to.be.json;
    expect(res).to.have.status(HTTP_CODE.OK);
    // Did the response have the correct number of readings.
    expect(res.body).to.have.property(`${id}`).to.have.lengthOf(expected.length);
    // Loop over each reading
    for (let i = 0; i < expected.length; i++) {
        // Check that the reading's value is within the expected tolerance (DELTA).
        expect(res.body).to.have.property(`${id}`).to.have.property(`${i}`).to.have.property('reading').to.be.closeTo(Number(expected[i][0]), DELTA);
        // Reading has correct start/end date and time.
        expect(res.body).to.have.property(`${id}`).to.have.property(`${i}`).to.have.property('startTimestamp').to.equal(Date.parse(expected[i][1]));
        expect(res.body).to.have.property(`${id}`).to.have.property(`${i}`).to.have.property('endTimestamp').to.equal(Date.parse(expected[i][2]));
    }
}

/**
 * Compares readings from api call against the expected readings csv
 * @param {request.Response} res the response to the HTTP GET request from Chai
 * @param {array} expected the returned array from parseExpectedCsv
 */
function expectRangeToEqualExpected(res, expected, id = METER_ID) {
    expect(res).to.be.json;
    expect(res).to.have.status(HTTP_CODE.OK);
    // Did the response have the correct number of readings.
    expect(res.body).to.have.property(`${id}`).to.have.lengthOf(expected.length);
    // Loop over each reading
    for (let i = 0; i < expected.length; i++) {
        // Check that the reading's min/max is within the expected tolerance (DELTA).
       expect(res.body).to.have.property(`${id}`).to.have.property(`${i}`).to.have.property('min').to.be.closeTo(Number(expected[i][0]), DELTA);
       expect(res.body).to.have.property(`${id}`).to.have.property(`${i}`).to.have.property('max').to.be.closeTo(Number(expected[i][1]), DELTA);
       // Reading has correct start/end date and time.
        expect(res.body).to.have.property(`${id}`).to.have.property(`${i}`).to.have.property('startTimestamp').to.equal(Date.parse(expected[i][2]));
        expect(res.body).to.have.property(`${id}`).to.have.property(`${i}`).to.have.property('endTimestamp').to.equal(Date.parse(expected[i][3]));
    }
}

/**
 * Compares readings from compare api call against the expected readings
 * @param {request.Response} res the response to the HTTP GET request from Chai
 * @param {array} expected the returned array from parseExpectedCsv
 */
function expectCompareToEqualExpected(res, expected, id = METER_ID) {
    expect(res).to.be.json;
    expect(res).to.have.status(HTTP_CODE.OK);
    // Did the response have the correct meter
    expect(res.body).to.have.property(`${id}`);
    // Check that the reading's values (previous value and current value) is within the expected tolerance (DELTA).
    expect(res.body).to.have.property(`${id}`).to.have.property('curr_use').to.be.closeTo(Number(expected[0]), DELTA);
    expect(res.body).to.have.property(`${id}`).to.have.property('prev_use').to.be.closeTo(Number(expected[1]), DELTA);
}

/**
 * Compares readings from api call against the expected readings csv
 * @param {request.Response} res the response to the HTTP GET request from Chai
 * @param {array} expected the returned array from parseExpectedCsv of expected values
 * @param {integer} timePerReading hours each reading covers
 * @param {boolean} noData true if 3D request cannot return data so special values, false by default
 */
function expectThreeDReadingToEqualExpected(res, expected, timePerReading, noData = false) {
    let readingsPerDay = 24 / timePerReading;
    // Number of days expected to be returned. Special of only 1 value if 3D cannot return data so special value.
    let days = noData ? 1 : expected.length / readingsPerDay;
    expect(res).to.be.json;
    expect(res).to.have.status(HTTP_CODE.OK);
    // Did the response have the correct type of properties.
    expect(res.body).to.have.property('xData');
    expect(res.body).to.have.property('yData');
    expect(res.body).to.have.property('zData').to.have.lengthOf(days);
    // The lengths should be correct.
    expect(res.body, 'xData length').to.have.property(`xData`).to.have.lengthOf(readingsPerDay);
    expect(res.body, 'yData length').to.have.property(`yData`).to.have.lengthOf(days);
    expect(res.body, 'zData length').to.have.property(`zData`).to.have.lengthOf(days);
    // Only check the first one but the others are checked in the loop for value.
    expect(res.body.zData[0], 'zData[0] length').to.have.lengthOf(readingsPerDay);

    // xData should have readingsPerDay values with the start/end time of each point in the day.
    for (let hourIndex = 0; hourIndex < readingsPerDay; hourIndex++) {
        expect(res.body.xData[hourIndex]).to.have.property('startTimestamp').to.be.equal(Date.parse(expected[hourIndex][1]));
        expect(res.body.xData[hourIndex]).to.have.property('endTimestamp').to.be.equal(Date.parse(expected[hourIndex][2]));
    }

    // yData should have days values with each day start time.
    // The index in expected which is first reading of each day.
    let expectedIndex = 0;
    for (let dayIndex = 0; dayIndex < days; dayIndex++) {
        expect(res.body.yData[dayIndex]).to.be.equal(Date.parse(expected[expectedIndex][1]));
        expectedIndex += readingsPerDay;
    }

    // zData should be a 2D array where the first index has days values and the second has readingsPerDay
    // and each value is the reading at that day and time.
    // The index in expected which increases by 1.
    expectedIndex = 0;
    for (let dayIndex = 0; dayIndex < days; dayIndex++) {
        for (let hourIndex = 0; hourIndex < readingsPerDay; hourIndex++) {
            // When there are holes in the data that are filled the expected value is 'null' and requires a special check.
            if (expected[expectedIndex][0] === 'null') {
                expect(res.body.zData[dayIndex][hourIndex]).to.equal(null);
            } else {
                expect(res.body.zData[dayIndex][hourIndex]).to.be.closeTo(Number(expected[expectedIndex][0]), DELTA);
            }
            expectedIndex++;
        }
    }
}

/**
 * Create an ISO standard date range to use as a timeInterval query for the API
 * @param {string} startDay formatted as YYYY-MM-DD
 * @param {string} startTime formatted as HH:MM:SS
 * @param {string} endDay formatted as YYYY-MM-DD
 * @param {string} endTime formatted as HH:MM:SS
 * @returns {string} a string with the format '20XX-XX-XXT00:00:00Z_20XX-XX-XXT00:00:00Z'
 */
function createTimeString(startDay, startTime, endDay, endTime) {
    const dateString = new TimeInterval(moment(startDay + ' ' + startTime), moment(endDay + ' ' + endTime));
    return dateString.toString();
}

/**
 * Get the unit id given name of unit.
 * @param {string} unitName
 * @returns {number} id of unitName
 */
async function getUnitId(unitName) {
    conn = testDB.getConnection();
    const unit = await Unit.getByName(unitName, conn);
    if (!unit) {
        // This is not a valid unit name so return -99.
        return -99;
    } else {
        return (await Unit.getByName(unitName, conn)).id;
    }
}

// These units and conversions are used in many tests.
// These are the 2D arrays for units, conversions to feed into the database
// For kWh units.
const unitDatakWh = [
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
        name: 'Electric_Utility',
        identifier: '',
        unitRepresent: Unit.unitRepresentType.QUANTITY,
        secInRate: 3600,
        typeOfUnit: Unit.unitType.METER,
        suffix: '',
        displayable: Unit.displayableType.NONE,
        preferredDisplay: false,
        note: 'special unit'
    }
];
const conversionDatakWh = [
    {
        sourceName: 'Electric_Utility',
        destinationName: 'kWh',
        bidirectional: false,
        slope: 1,
        intercept: 0,
        note: 'Electric_Utility → kWh'
    }
];
const meterDatakWh = [
    {
        name: 'Electric Utility kWh',
        unit: 'Electric_Utility',
        defaultGraphicUnit: 'kWh',
        displayable: true,
        gps: undefined,
        note: 'special meter',
        file: 'test/web/readingsData/readings_ri_15_days_75.csv',
        deleteFile: false,
        readingFrequency: '15 minutes',
        // Note the meter ID is set so we know what to expect when a query is made.
        id: METER_ID
    }
];
const meterDatakWhOther = [
    {
        name: 'Electric Utility Other',
        unit: 'Electric_Utility',
        defaultGraphicUnit: 'kWh',
        displayable: true,
        gps: undefined,
        note: 'special meter',
        file: 'test/web/readingsData/readings_ri_20_days_75.csv',
        deleteFile: false,
        readingFrequency: '20 minutes',
        id: (METER_ID + 1)
    }
];
const meterDatakWhGroups = meterDatakWh.concat(meterDatakWhOther);

const groupDatakWh = [
    {
        id: GROUP_ID,
        name: 'Electric Utility kWh + Other',
        displayable: true,
        note: 'special group',
        defaultGraphicUnit: 'kWh',
        childMeters: ['Electric Utility kWh', 'Electric Utility Other'],
        childGroups: [],
    }
];

module.exports = {
    prepareTest,
    parseExpectedCsv,
    expectReadingToEqualExpected,
    expectRangeToEqualExpected,
    expectCompareToEqualExpected,
    expectThreeDReadingToEqualExpected,
    createTimeString,
    getUnitId,
    ETERNITY,
    DELTA,
    METER_ID,
    GROUP_ID,
    HTTP_CODE,
    unitDatakWh,
    conversionDatakWh,
    meterDatakWh,
    meterDatakWhGroups,
    groupDatakWh
};
