const { chai, mocha, expect, app, testDB } = require('../common');
const { TimeInterval } = require('../../../common/TimeInterval');
const { insertUnits, insertConversions, insertMeters, insertGroups } = require('../../util/insertData');
const Unit = require('../../models/Unit');
const { redoCik } = require('../../services/graph/redoCik');
const { refreshAllReadingViews } = require('../../services/refreshAllReadingViews');
const readCsv = require('../../services/pipeline-in-progress/readCsv');
const moment = require('moment');
const { ModuleResolutionKind } = require('typescript');

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
	await insertMeters(meterData, conn);
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
function expectReadingToEqualExpected(res, expected) {
	expect(res).to.be.json;
	expect(res).to.have.status(HTTP_CODE.OK);
	// Did the response have the correct number of readings.
	expect(res.body).to.have.property(`${METER_ID}`).to.have.lengthOf(expected.length);
	// Loop over each reading
	for (let i = 0; i < expected.length; i++) {
		// Check that the reading's value is within the expected tolerance (DELTA).
		expect(res.body).to.have.property(`${METER_ID}`).to.have.property(`${i}`).to.have.property('reading').to.be.closeTo(Number(expected[i][0]), DELTA);
		// Reading has correct start/end date and time.
		expect(res.body).to.have.property(`${METER_ID}`).to.have.property(`${i}`).to.have.property('startTimestamp').to.equal(Date.parse(expected[i][1]));
		expect(res.body).to.have.property(`${METER_ID}`).to.have.property(`${i}`).to.have.property('endTimestamp').to.equal(Date.parse(expected[i][2]));
	}
}

/**
 * Compares readings from api call against the expected readings csv
 * @param {request.Response} res the response to the HTTP GET request from Chai
 * @param {array} expected the returned array from parseExpectedCsv
 */
function expectThreeDReadingToEqualExpected(res, expected, readingsPerDay) {

	const days = expected.length / readingsPerDay;
	expect(res).to.be.json;
	expect(res).to.have.status(HTTP_CODE.OK);
	// Did the response have the correct number of readings.
	expect(res.body).to.have.property('xData');
    expect(res.body).to.have.property('yData');
    expect(res.body).to.have.property('zData').to.have.lengthOf(days);

    let k = 0;
	let h = 0;
    for (let i = 0; i < days; i++){
        for (let j = 0; j < 24; j++){
			if (i == 0) {
				let hourTimeStamp = moment(expected[i][1]).add(j, 'h').add(30, 'm');
				expect(res.body.xData[j]).to.be.equal(hourTimeStamp.valueOf());
			}
			if (readingsPerDay == 24){
            	expect(res.body.zData[i][j]).to.be.closeTo(Number(expected[h][0]), DELTA);
				h++;
			}
			expect(res.body.zData[i][j]).to.be.not.equal(null);
        }
		expect(res.body.yData[i]).to.be.equal(Date.parse(expected[k][1]));
        k += readingsPerDay;
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
	['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'OED created standard unit'],
	['Electric_Utility', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit']
];
const conversionDatakWh = [['Electric_Utility', 'kWh', false, 1, 0, 'Electric_Utility → kWh']];

module.exports = {
	prepareTest,
	parseExpectedCsv,
    expectReadingToEqualExpected,
    expectThreeDReadingToEqualExpected,
	createTimeString,
	getUnitId,
	ETERNITY,
	DELTA,
	METER_ID,
	GROUP_ID,
	HTTP_CODE,
    unitDatakWh,
    conversionDatakWh
};