/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { chai, mocha, expect, app, testDB, testUser } = require('../common');
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');
const Point = require('../../models/Point');
const Unit = require('../../models/Unit');
const { insertStandardUnits, insertStandardConversions, insertUnits, insertConversions } = require('../../util/insertData')
const { redoCik } = require('../../services/graph/redoCik');
const util = require('util');
const fs = require('fs');
const csv = require('csv');
const moment = require('moment');

const parseCsv = util.promisify(csv.parse);

const UPLOAD_METERS_ROUTE = '/api/csv/meters';
const UPLOAD_READINGS_ROUTE = '/api/csv/readings';

// The default fields and routes for the requests
const CHAI_READINGS_REQUEST = `chai.request(app).post('${UPLOAD_READINGS_ROUTE}').field('username', '${testUser.username}').field('password', '${testUser.password}')`;
const CHAI_METERS_REQUEST = `chai.request(app).post('${UPLOAD_METERS_ROUTE}').field('username', '${testUser.username}').field('password', '${testUser.password}')`;

// test if email parameter works as well to allow for backwards compatibility
const CHAI_READINGS_REQUEST_EMAIL = `chai.request(app).post('${UPLOAD_READINGS_ROUTE}').field('email', '${testUser.username}').field('password', '${testUser.password}')`;
const CHAI_METERS_REQUEST_EMAIL = `chai.request(app).post('${UPLOAD_METERS_ROUTE}').field('email', '${testUser.username}').field('password', '${testUser.password}')`;

// Note there is only one description for all uploads in a test (not an array)
// but all other keys are arrays of length number of uploads in test.
// Note the use of double quotes for strings because some have single quotes within.

/**
 * description, what the tests aims to test
 * chaiRequest, makes a string of the parameters
 * fileName, the input files used for the test
 * responseCode, the expected response code from the request
 * responseString, the expected response string from the request
*/
const testCases = {
	pipe1: {
		description: 'Ascending time readings',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier', 'pipe1').field('gzip', false)"],
		fileName: ['pipe1Input.csv'],
		createMeter: true,
		responseCode: [200],
		responseString: ['<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2>']
	},
	pipe2: {
		description: 'Descending time readings',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier', 'pipe2').field('gzip', false).field('timeSort', 'decreasing')"],
		fileName: ['pipe2Input.csv'],
		createMeter: true,
		responseCode: [200],
		responseString: ['<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2>']
	},
	pipe3: {
		description: 'Cumulative time readings',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier', 'pipe3').field('gzip', false).field('cumulative', true)"],
		fileName: ['pipe3Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe3: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe3 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe3</li></ol>']
	},
	pipe4: {
		description: 'Cumulative, descending time readings',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('timeSort','decreasing').field('cumulative',true).field('meterIdentifier','pipe4').field('gzip', false)"],
		fileName: ['pipe4Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe4: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe4 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort decreasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe4</li></ol>']
	},
	pipe5: {
		description: 'Cumulative time readings with reset with default cumulative reset',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier', 'pipe5').field('gzip', false).field('cumulative', true).field('cumulativeReset',true)"],
		createMeter: true,
		fileName: ['pipe5Input.csv'],
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe5: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe5 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset true; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe5</li></ol>']
	},
	pipe6: {
		description: 'Cumulative time readings with reset with cumulative reset around midnight',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('cumulative',true).field('cumulativeReset',true).field('cumulativeResetStart','23:45').field('cumulativeResetEnd','00:15').field('meterIdentifier','pipe6').field('gzip',false)"],
		fileName: ['pipe6Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe6: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe6 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset true; cumulativeResetStart 23:45; cumulativeResetEnd 00:15; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe6</li></ol>']
	},
	pipe7: {
		description: 'Cumulative time readings with reset with cumulative reset around noon which is incorrect',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier', 'pipe7').field('gzip', false).field('cumulative', true).field('cumulativeReset',true).field('cumulativeResetStart','11:45').field('cumulativeResetEnd','12:15')"],
		fileName: ['pipe7Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe7: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe7 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset true; cumulativeResetStart 11:45; cumulativeResetEnd 12:15; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe7: Error parsing Reading #4. Reading value of 96 gives -48 with error message:<br>A negative meterReading has been detected but either cumulativeReset is not enabled, or the start time and end time of this reading is out of the reset range. Reject all readings.<br>For reading #4 on meter pipe7 in pipeline: previous reading has value 72 start time 2021-06-03T00:00:00Z end time 2021-06-04T00:00:00Z and current reading has value -48 start time 2021-06-04T00:00:00Z end time 2021-06-05T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset true; cumulativeResetStart 11:45; cumulativeResetEnd 12:15; lengthGap 0; lengthVariation 0; onlyEndTime false<br>'],
	},
	pipe8: {
		description: 'Cumulative time readings with reset with cumulative reset tight around midnight',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('cumulative',true).field('cumulativeReset',true).field('cumulativeResetStart','00:00').field('cumulativeResetEnd','00:00.001').field('meterIdentifier','pipe8').field('gzip',false)"],
		fileName: ['pipe8Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe8: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe8 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset true; cumulativeResetStart 00:00; cumulativeResetEnd 00:00.001; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe8</li></ol>']
	},
	pipe9: {
		description: 'Cumulative time readings with reset without cumulative reset which is incorrect',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('cumulative',true).field('meterIdentifier','pipe9').field('gzip', false)"],
		fileName: ['pipe9Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe9: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe9 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe9: Error parsing Reading #4. Reading value of 96 gives -48 with error message:<br>A negative meterReading has been detected but either cumulativeReset is not enabled, or the start time and end time of this reading is out of the reset range. Reject all readings.<br>For reading #4 on meter pipe9 in pipeline: previous reading has value 72 start time 2021-06-03T00:00:00Z end time 2021-06-04T00:00:00Z and current reading has value -48 start time 2021-06-04T00:00:00Z end time 2021-06-05T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br>']
	},
	pipe10: {
		description: 'Cumulative time readings changing at noon with default cumulative reset',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('cumulative',true).field('cumulativeReset',true).field('meterIdentifier','pipe10').field('gzip',false)"],
		fileName: ['pipe10Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe10: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe10 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T12:00:00Z end time 2021-06-02T12:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset true; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe10</li></ol>']
	},
	pipe11: {
		description: 'Cumulative time readings changing at noon without cumulative reset which is incorrect',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('cumulative',true).field('meterIdentifier','pipe11').field('gzip',false)"],
		fileName: ['pipe11Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe11: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe11 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T12:00:00Z end time 2021-06-02T12:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe11: Error parsing Reading #4. Reading value of 96 gives -48 with error message:<br>A negative meterReading has been detected but either cumulativeReset is not enabled, or the start time and end time of this reading is out of the reset range. Reject all readings.<br>For reading #4 on meter pipe11 in pipeline: previous reading has value 72 start time 2021-06-03T12:00:00Z end time 2021-06-04T12:00:00Z and current reading has value -48 start time 2021-06-04T12:00:00Z end time 2021-06-05T12:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br>']
	},
	pipe12: {
		description: 'Cumulative time readings changing at noon with cumulative reset at noon',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('cumulative',true).field('cumulativeReset',true).field('cumulativeResetStart','11:45').field('cumulativeResetEnd','12:15').field('meterIdentifier','pipe12').field('gzip',false)"],
		fileName: ['pipe12Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe12: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe12 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T12:00:00Z end time 2021-06-02T12:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset true; cumulativeResetStart 11:45; cumulativeResetEnd 12:15; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe12</li></ol>']
	},
	pipe13: {
		description: 'Cumulative time readings changing at noon with cumulative reset at midnight which is incorrect',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('cumulative',true).field('cumulativeReset',true).field('cumulativeResetStart','23:45').field('cumulativeResetEnd','00:15').field('meterIdentifier','pipe13').field('gzip',false)"],
		fileName: ['pipe13Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe13: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe13 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T12:00:00Z end time 2021-06-02T12:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset true; cumulativeResetStart 23:45; cumulativeResetEnd 00:15; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe13: Error parsing Reading #4. Reading value of 96 gives -48 with error message:<br>A negative meterReading has been detected but either cumulativeReset is not enabled, or the start time and end time of this reading is out of the reset range. Reject all readings.<br>For reading #4 on meter pipe13 in pipeline: previous reading has value 72 start time 2021-06-03T12:00:00Z end time 2021-06-04T12:00:00Z and current reading has value -48 start time 2021-06-04T12:00:00Z end time 2021-06-05T12:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset true; cumulativeResetStart 23:45; cumulativeResetEnd 00:15; lengthGap 0; lengthVariation 0; onlyEndTime false<br>']
	},
	pipe14: {
		description: 'Ascending time readings with length variation and default time variation',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe14').field('gzip',false)"],
		fileName: ['pipe14Input.csv'],
		createMeter: true,
		responseCode: [200],
		responseString: ['<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2><h3>However, note that the processing of the readings returned these warning(s):</h3><br>For meter pipe14: Warning parsing Reading #2. Reading value gives 48 with warning message:<br>The previous reading has a different time length than the current reading and exceeds the tolerance of 0 seconds. Note this is treated only as a warning since this may be expected for certain meters.<br>For reading #2 on meter pipe14 in pipeline: previous reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z and current reading has value 48 start time 2021-06-02T00:00:00Z end time 2021-06-03T00:01:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe14: Warning parsing Reading #3. Reading value gives 72 with warning message:<br>The previous reading has a different time length than the current reading and exceeds the tolerance of 0 seconds. Note this is treated only as a warning since this may be expected for certain meters.<br>For reading #3 on meter pipe14 in pipeline: previous reading has value 48 start time 2021-06-02T00:00:00Z end time 2021-06-03T00:01:00Z and current reading has value 72 start time 2021-06-03T00:01:00Z end time 2021-06-04T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe14: Warning parsing Reading #4. Reading value gives 96 with warning message:<br>The previous reading has a different time length than the current reading and exceeds the tolerance of 0 seconds. Note this is treated only as a warning since this may be expected for certain meters.<br>For reading #4 on meter pipe14 in pipeline: previous reading has value 72 start time 2021-06-03T00:01:00Z end time 2021-06-04T00:00:00Z and current reading has value 96 start time 2021-06-04T00:00:00Z end time 2021-06-04T23:58:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe14: Warning parsing Reading #5. Reading value gives 120 with warning message:<br>The previous reading has a different time length than the current reading and exceeds the tolerance of 0 seconds. Note this is treated only as a warning since this may be expected for certain meters.<br>For reading #5 on meter pipe14 in pipeline: previous reading has value 96 start time 2021-06-04T00:00:00Z end time 2021-06-04T23:58:00Z and current reading has value 120 start time 2021-06-04T23:58:00Z end time 2021-06-06T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br>']
	},
	pipe15: {
		description: 'Ascending time readings with length variation where length variation set small so warns on 2 readings',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe15').field('lengthVariation','60').field('gzip',false)"],
		fileName: ['pipe15Input.csv'],
		createMeter: true,
		responseCode: [200],
		responseString: ['<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2><h3>However, note that the processing of the readings returned these warning(s):</h3><br>For meter pipe15: Warning parsing Reading #3. Reading value gives 72 with warning message:<br>The previous reading has a different time length than the current reading and exceeds the tolerance of 60 seconds. Note this is treated only as a warning since this may be expected for certain meters.<br>For reading #3 on meter pipe15 in pipeline: previous reading has value 48 start time 2021-06-02T00:00:00Z end time 2021-06-03T00:01:00Z and current reading has value 72 start time 2021-06-03T00:01:00Z end time 2021-06-04T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 60; onlyEndTime false<br><br>For meter pipe15: Warning parsing Reading #5. Reading value gives 120 with warning message:<br>The previous reading has a different time length than the current reading and exceeds the tolerance of 60 seconds. Note this is treated only as a warning since this may be expected for certain meters.<br>For reading #5 on meter pipe15 in pipeline: previous reading has value 96 start time 2021-06-04T00:00:00Z end time 2021-06-04T23:58:00Z and current reading has value 120 start time 2021-06-04T23:58:00Z end time 2021-06-06T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 60; onlyEndTime false<br>']
	},
	pipe16: {
		description: 'Ascending time readings with length variation and length variation set so warns on 1 reading',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe16').field('lengthVariation','120').field('gzip',false)"],
		fileName: ['pipe16Input.csv'],
		createMeter: true,
		responseCode: [200],
		responseString: ['<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2><h3>However, note that the processing of the readings returned these warning(s):</h3><br>For meter pipe16: Warning parsing Reading #5. Reading value gives 120 with warning message:<br>The previous reading has a different time length than the current reading and exceeds the tolerance of 120 seconds. Note this is treated only as a warning since this may be expected for certain meters.<br>For reading #5 on meter pipe16 in pipeline: previous reading has value 96 start time 2021-06-04T00:00:00Z end time 2021-06-04T23:58:00Z and current reading has value 120 start time 2021-06-04T23:58:00Z end time 2021-06-06T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 120; onlyEndTime false<br>']
	},
	pipe17: {
		description: 'Ascending time readings with length variation and gap where length variation set so all pass but gap not big enough so warns on 2 reading',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe17').field('lengthVariation','121').field('gzip',false)"],
		fileName: ['pipe17Input.csv'],
		createMeter: true,
		responseCode: [200],
		responseString: ['<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2><h3>However, note that the processing of the readings returned these warning(s):</h3><br>For meter pipe17: Warning parsing Reading #2. Reading value gives 48 with warning message:<br>There is a gap in time between this reading and the previous reading that exceeds the allowed amount of 0 seconds.<br>For reading #2 on meter pipe17 in pipeline: previous reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z and current reading has value 48 start time 2021-06-02T00:01:00Z end time 2021-06-03T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 121; onlyEndTime false<br><br>For meter pipe17: Warning parsing Reading #4. Reading value gives 96 with warning message:<br>There is a gap in time between this reading and the previous reading that exceeds the allowed amount of 0 seconds.<br>For reading #4 on meter pipe17 in pipeline: previous reading has value 72 start time 2021-06-03T00:00:00Z end time 2021-06-04T00:00:00Z and current reading has value 96 start time 2021-06-04T00:02:00Z end time 2021-06-05T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 121; onlyEndTime false<br>']
	},
	pipe18: {
		description: 'Ascending time readings with gaps and small time gap so 1 passes and 1 warns',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe18').field('lengthGap','60').field('lengthVariation','121').field('gzip',false)"],
		fileName: ['pipe18Input.csv'],
		createMeter: true,
		responseCode: [200],
		responseString: ['<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2><h3>However, note that the processing of the readings returned these warning(s):</h3><br>For meter pipe18: Warning parsing Reading #4. Reading value gives 96 with warning message:<br>There is a gap in time between this reading and the previous reading that exceeds the allowed amount of 60 seconds.<br>For reading #4 on meter pipe18 in pipeline: previous reading has value 72 start time 2021-06-03T00:00:00Z end time 2021-06-04T00:00:00Z and current reading has value 96 start time 2021-06-04T00:02:00Z end time 2021-06-05T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 60; lengthVariation 121; onlyEndTime false<br>']
	},
	pipe19: {
		description: 'Ascending time readings with gap and just right size time gap',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe19').field('lengthGap','120').field('lengthVariation','121').field('gzip',false)"],
		fileName: ['pipe19Input.csv'],
		createMeter: true,
		responseCode: [200],
		responseString: ['<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2>']
	},
	pipe20: {
		description: 'Cumulative time readings with header',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('headerRow',true).field('cumulative',true).field('meterIdentifier','pipe20').field('gzip',false)"],
		fileName: ['pipe20Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe20: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe20 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe20</li></ol>']
	},
	pipe21: {
		description: 'Cumulative time readings with duplication',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('duplications','3').field('cumulative',true).field('meterIdentifier','pipe21').field('gzip',false)"],
		fileName: ['pipe21Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe21: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe21 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 3; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe21</li></ol>']
	},
	pipe22: {
		description: 'Cumulative time readings with default cumulative reset with negative reading which in incorrect',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('cumulative',true).field('cumulativeReset',true).field('meterIdentifier','pipe22').field('gzip',false)"],
		fileName: ['pipe22Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe22: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe22 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset true; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br>For meter pipe22: <br>Error parsing Reading #4. Detected a negative value while handling cumulative readings so all reading are rejected.<br>For reading #4 on meter pipe22 in pipeline: previous reading has value 72 start time 2021-06-03T00:00:00Z end time 2021-06-04T00:00:00Z and current reading has value -145 start time 2021-06-04T00:00:00Z end time 2021-06-05T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset true; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br>']
	},
	pipe23: {
		description: 'Ascending time readings that are end only',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('endOnly',true).field('meterIdentifier','pipe23').field('gzip',false)"],
		fileName: ['pipe23Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe23: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing only with endTimestamps.<br>For reading #1 on meter pipe23 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 1970-01-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime true<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe23</li></ol>']
	},
	pipe24: {
		description: 'Descending time readings that are end only',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('timeSort','decreasing').field('endOnly',true).field('meterIdentifier','pipe24').field('gzip',false)"],
		fileName: ['pipe24Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe24: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing only with endTimestamps.<br>For reading #1 on meter pipe24 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 1970-01-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort decreasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime true<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe24</li></ol>']
	},
	pipe25: {
		description: 'Descending, cumulative time readings that are end only',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('cumulative',true).field('timeSort','decreasing').field('endOnly',true).field('meterIdentifier','pipe25').field('gzip',false)"],
		fileName: ['pipe25Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe25: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>The first ever reading must be dropped when dealing only with endTimestamps.<br>For reading #1 on meter pipe25 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 1970-01-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort decreasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime true<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe25</li></ol>']
	},
	pipe26: {
		description: 'Ascending time readings with bad start date/time which is incorrect',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe26').field('gzip',false)"],
		fileName: ['pipe26Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2>For meter pipe26: Error parsing Reading #2 The start (2021-06-02 00:00:00 x) and/or end time (2021-06-03 00:00:00) provided did not parse into a valid date/time so all reading are rejected.<br>For reading #2 on meter pipe26 in pipeline: previous reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z and current reading has value unknown start time Invalid date end time 2021-06-03T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br>']
	},
	pipe27: {
		description: 'Ascending time readings with bad end date/time which is incorrect',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe27').field('gzip',false)"],
		createMeter: true,
		fileName: ['pipe27Input.csv'],
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2>For meter pipe27: Error parsing Reading #2 The start (2021-06-02 00:00:00) and/or end time (2021-06-32 00:00:00) provided did not parse into a valid date/time so all reading are rejected.<br>For reading #2 on meter pipe27 in pipeline: previous reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z and current reading has value unknown start time 2021-06-02T00:00:00Z end time Invalid date with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br>']
	},
	// Pipe28 removed since stronger tests on dates cause it to fail.
	pipe29: {
		description: 'Cumulative time readings with bad reading value which in incorrect',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('cumulative',true).field('meterIdentifier','pipe29').field('gzip',false)"],
		fileName: ['pipe29Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe29: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe29 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br>For meter pipe29: Error parsing Reading #4 with cumulative data. The reading value provided of 240.x is not considered a number so all reading are rejected.<br>']
	},
	pipe30: {

		description: 'Ascending time readings with bad reading value which in incorrect',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe30').field('gzip',false)"],
		fileName: ['pipe30Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2>For meter pipe30: Error parsing Reading #4 The reading value provided of 9a is not considered a number so all reading are rejected.<br>']
	},
	pipe31: {
		description: 'Cumulative time readings with gaps with length variation but still needs to drop 2 readings with gap',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe31').field('cumulative',true).field('lengthVariation','121').field('gzip',false)"],
		fileName: ['pipe31Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe31: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe31 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 121; onlyEndTime false<br><br>For meter pipe31: Error parsing Reading #2. Reading value gives 48 with error message:<br>The end of the previous reading is too far from the start of the next readings in cumulative data so drop this reading.<br>For reading #2 on meter pipe31 in pipeline: previous reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z and current reading has value 48 start time 2021-06-02T00:01:00Z end time 2021-06-03T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 121; onlyEndTime false<br><br>For meter pipe31: Error parsing Reading #4. Reading value gives 96 with error message:<br>The end of the previous reading is too far from the start of the next readings in cumulative data so drop this reading.<br>For reading #4 on meter pipe31 in pipeline: previous reading has value 72 start time 2021-06-03T00:00:00Z end time 2021-06-04T00:00:00Z and current reading has value 96 start time 2021-06-04T00:02:00Z end time 2021-06-05T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 121; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe31</li><li>Dropped Reading #2 for meter pipe31</li><li>Dropped Reading #4 for meter pipe31</li></ol>']
	},
	pipe32: {
		description: 'Cumulative time readings with one reading start before end of previous so dropped',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe32').field('cumulative',true).field('gzip',false)"],
		fileName: ['pipe32Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe32: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe32 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe32: Error parsing Reading #2. Reading value gives 48 with error message:<br>The reading start time is before the previous end time and the data is cumulative so OED cannot use this reading.<br>For reading #2 on meter pipe32 in pipeline: previous reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z and current reading has value 48 start time 2021-06-01T23:59:59Z end time 2021-06-03T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe32: Warning parsing Reading #3. Reading value gives 72 with warning message:<br>The previous reading has a different time length than the current reading and exceeds the tolerance of 0 seconds. Note this is treated only as a warning since this may be expected for certain meters.<br>For reading #3 on meter pipe32 in pipeline: previous reading has value 48 start time 2021-06-01T23:59:59Z end time 2021-06-03T00:00:00Z and current reading has value 72 start time 2021-06-03T00:00:00Z end time 2021-06-04T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe32</li><li>Dropped Reading #2 for meter pipe32</li></ol>']
	},
	pipe33: {
		description: 'Cumulative time readings with negative reading which is incorrect',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe33').field('cumulative',true).field('gzip',false)"],
		fileName: ['pipe33Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe33: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe33 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br>For meter pipe33: <br>Error parsing Reading #3. Detected a negative value while handling cumulative readings so all reading are rejected.<br>For reading #3 on meter pipe33 in pipeline: previous reading has value 48 start time 2021-06-02T00:00:00Z end time 2021-06-03T00:00:00Z and current reading has value -73 start time 2021-06-03T00:00:00Z end time 2021-06-04T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br>']
	},
	pipe34: {
		description: 'Ascending time readings with one reading start/end the same so dropped',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe34').field('gzip',false)"],
		fileName: ['pipe34Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe34: Error parsing Reading #2. Reading value gives 48 with error message:<br>The reading end time is not after the start time so we must drop the reading.<br>For reading #2 on meter pipe34 in pipeline: previous reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z and current reading has value 48 start time 2021-06-02T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe34: Warning parsing Reading #3. Reading value gives 72 with warning message:<br>There is a gap in time between this reading and the previous reading that exceeds the allowed amount of 0 seconds.<br>The previous reading has a different time length than the current reading and exceeds the tolerance of 0 seconds. Note this is treated only as a warning since this may be expected for certain meters.<br>For reading #3 on meter pipe34 in pipeline: previous reading has value 48 start time 2021-06-02T00:00:00Z end time 2021-06-02T00:00:00Z and current reading has value 72 start time 2021-06-03T00:00:00Z end time 2021-06-04T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #2 for meter pipe34</li></ol>']
	},
	pipe35: {
		description: 'Ascending time readings that are end only with two readings time the same so dropped',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('refreshReadings',true).field('meterIdentifier','pipe35').field('endOnly',true).field('gzip',false)"],
		fileName: ['pipe35Input.csv'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe35: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing only with endTimestamps.<br>For reading #1 on meter pipe35 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 1970-01-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime true<br><br>For meter pipe35: Error parsing Reading #2. Reading value gives 48 with error message:<br>The reading end time is not after the start time so we must drop the reading. The start time came from the previous readings end time.<br>For reading #2 on meter pipe35 in pipeline: previous reading has value 24 start time 1970-01-01T00:00:00Z end time 2021-06-02T00:00:00Z and current reading has value 48 start time 2021-06-02T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime true<br><br>For meter pipe35: Warning parsing Reading #3. Reading value gives 72 with warning message:<br>The previous reading has a different time length than the current reading and exceeds the tolerance of 0 seconds. Note this is treated only as a warning since this may be expected for certain meters.<br>For reading #3 on meter pipe35 in pipeline: previous reading has value 48 start time 2021-06-02T00:00:00Z end time 2021-06-02T00:00:00Z and current reading has value 72 start time 2021-06-02T00:00:00Z end time 2021-06-04T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime true<br><br>For meter pipe35: Warning parsing Reading #4. Reading value gives 96 with warning message:<br>The previous reading has a different time length than the current reading and exceeds the tolerance of 0 seconds. Note this is treated only as a warning since this may be expected for certain meters.<br>For reading #4 on meter pipe35 in pipeline: previous reading has value 72 start time 2021-06-02T00:00:00Z end time 2021-06-04T00:00:00Z and current reading has value 96 start time 2021-06-04T00:00:00Z end time 2021-06-05T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime true<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe35</li><li>Dropped Reading #2 for meter pipe35</li></ol>']
	},

	pipe40: {
		description: 'Cumulative time zipped readings with header',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('headerRow',true).field('cumulative',true).field('meterIdentifier', 'pipe40')"],
		fileName: ['pipe40Input.csv.gz'],
		createMeter: true,
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe40: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe40 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe40</li></ol>']
	},
	pipe50: {
		description: 'Ascending time readings with two readings uploads where update readings',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('gzip', false).field('meterIdentifier', 'pipe50')", CHAI_READINGS_REQUEST + ".field('gzip', false).field('update',true).field('meterIdentifier', 'pipe50')"],
		fileName: ['pipe50AInput.csv', 'pipe50BInput.csv'],
		createMeter: true,
		responseCode: [200, 200],
		responseString: ['<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2>', '<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2><h3>However, note that the processing of the readings returned these warning(s):</h3><br>For meter pipe50: Warning parsing Reading #1. Reading value gives 0 with warning message:<br>The current reading startTime is not after the previous reading\'s end time. Note this is treated only as a warning since readings may be sent out of order.<br>There is a gap in time between this reading and the previous reading that exceeds the allowed amount of 0 seconds.<br>For reading #1 on meter pipe50 in pipeline: previous reading has value 120 start time 2021-06-05T00:00:00Z end time 2021-06-06T00:00:00Z and current reading has value 0 start time 2021-05-31T00:00:00Z end time 2021-06-01T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br>']
	},
	pipe51: {
		description: 'Ascending time readings with two readings uploads without update so no changes',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe51').field('gzip',false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe51').field('gzip',false)"],
		fileName: ['pipe51AInput.csv', 'pipe51BInput.csv'],
		createMeter: true,
		responseCode: [200, 200],
		responseString: ['<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2>', '<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2><h3>However, note that the processing of the readings returned these warning(s):</h3><br>For meter pipe51: Warning parsing Reading #1. Reading value gives 0 with warning message:<br>The current reading startTime is not after the previous reading\'s end time. Note this is treated only as a warning since readings may be sent out of order.<br>There is a gap in time between this reading and the previous reading that exceeds the allowed amount of 0 seconds.<br>For reading #1 on meter pipe51 in pipeline: previous reading has value 120 start time 2021-06-05T00:00:00Z end time 2021-06-06T00:00:00Z and current reading has value 0 start time 2021-05-31T00:00:00Z end time 2021-06-01T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br>']
	},
	pipe52: {
		description: 'Cumulative time readings with default reset with two uploads to add more readings with a reset',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('cumulative',true).field('meterIdentifier','pipe52').field('gzip',false)", CHAI_READINGS_REQUEST + ".field('cumulative',true).field('cumulativeReset',true).field('meterIdentifier','pipe52').field('gzip',false)"],
		fileName: ['pipe52AInput.csv', 'pipe52BInput.csv'],
		createMeter: true,
		responseCode: [400, 200],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe52: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe52 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe52</li></ol>', '<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2>']
	},
	pipe60: {
		description: 'Cumulative time readings with three readings uploads',
		chaiRequest: [CHAI_READINGS_REQUEST + ".field('gzip', false).field('meterIdentifier', 'pipe60').field('cumulative', true)", CHAI_READINGS_REQUEST + ".field('gzip', false).field('meterIdentifier', 'pipe60').field('cumulative', true)", CHAI_READINGS_REQUEST + ".field('gzip', false).field('meterIdentifier', 'pipe60').field('cumulative', true)"],
		fileName: ['pipe60AInput.csv', 'pipe60BInput.csv', 'pipe60CInput.csv'],
		createMeter: true,
		responseCode: [400, 200, 200],
		responseString: ['<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe60: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe60 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe60</li></ol>', '<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2>', '<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2>']
	},
	pipe70: {
		description: 'Create meter cumulative reset around noon with reading upload with reset at midnight which is incorrect',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip',false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe70').field('gzip',false)"],
		fileName: ['pipe70AInputMeter.csv', 'pipe70BInput.csv'],
		responseCode: [200, 400],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe70: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe70 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset true; cumulativeResetStart 11:45:00; cumulativeResetEnd 12:15:00; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe70: Error parsing Reading #4. Reading value of 96 gives -48 with error message:<br>A negative meterReading has been detected but either cumulativeReset is not enabled, or the start time and end time of this reading is out of the reset range. Reject all readings.<br>For reading #4 on meter pipe70 in pipeline: previous reading has value 72 start time 2021-06-03T00:00:00Z end time 2021-06-04T00:00:00Z and current reading has value -48 start time 2021-06-04T00:00:00Z end time 2021-06-05T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset true; cumulativeResetStart 11:45:00; cumulativeResetEnd 12:15:00; lengthGap 0; lengthVariation 0; onlyEndTime false<br>']
	},
	pipe71: {
		description: 'Create meter cumulative reset around midnight with reading upload with reset at midnight',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip',false)", CHAI_READINGS_REQUEST + ".field('cumulative',true).field('cumulativeReset',true).field('cumulativeResetStart','23:45').field('cumulativeResetEnd','00:15').field('meterIdentifier','pipe71').field('gzip',false)"],
		fileName: ['pipe71AInputMeter.csv', 'pipe71BInput.csv'],
		responseCode: [200, 400],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe71: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe71 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset true; cumulativeResetStart 23:45; cumulativeResetEnd 00:15; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe71</li></ol>']
	},
	pipe72: {
		description: 'Create meter with modest length variation and gap with reading upload where warn on larger gaps',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip',false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe72').field('gzip',false)"],
		fileName: ['pipe72AInputMeter.csv', 'pipe72BInput.csv'],
		responseCode: [200, 200],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2><h3>However, note that the processing of the readings returned these warning(s):</h3><br>For meter pipe72: Warning parsing Reading #4. Reading value gives 96 with warning message:<br>There is a gap in time between this reading and the previous reading that exceeds the allowed amount of 60 seconds.<br>For reading #4 on meter pipe72 in pipeline: previous reading has value 72 start time 2021-06-03T00:00:00Z end time 2021-06-04T00:00:00Z and current reading has value 96 start time 2021-06-04T00:02:00Z end time 2021-06-05T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 60; lengthVariation 120; onlyEndTime false<br><br>For meter pipe72: Warning parsing Reading #5. Reading value gives 120 with warning message:<br>The previous reading has a different time length than the current reading and exceeds the tolerance of 120 seconds. Note this is treated only as a warning since this may be expected for certain meters.<br>For reading #5 on meter pipe72 in pipeline: previous reading has value 96 start time 2021-06-04T00:02:00Z end time 2021-06-05T00:00:00Z and current reading has value 120 start time 2021-06-05T00:00:00Z end time 2021-06-06T00:04:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 60; lengthVariation 120; onlyEndTime false<br>']
	},
	pipe73: {
		description: 'Create meter with modest length variation and gap with reading upload that changes these values so fewer warnings; also checks floating point values in reading upload',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip',false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe73').field('lengthGap','120.1').field('lengthVariation','120.2').field('gzip',false)"],
		fileName: ['pipe73AInputMeter.csv', 'pipe73BInput.csv'],
		responseCode: [200, 200],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2><h3>However, note that the processing of the readings returned these warning(s):</h3><br>For meter pipe73: Warning parsing Reading #5. Reading value gives 120 with warning message:<br>The previous reading has a different time length than the current reading and exceeds the tolerance of 120.2 seconds. Note this is treated only as a warning since this may be expected for certain meters.<br>For reading #5 on meter pipe73 in pipeline: previous reading has value 96 start time 2021-06-04T00:02:00Z end time 2021-06-05T00:00:00Z and current reading has value 120 start time 2021-06-05T00:00:00Z end time 2021-06-06T00:04:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 120.1; lengthVariation 120.2; onlyEndTime false<br>']
	},
	pipe74: {
		description: 'Create meter with duplication with reading upload',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip',false)", CHAI_READINGS_REQUEST + ".field('cumulative',true).field('meterIdentifier','pipe74').field('gzip',false)"],
		fileName: ['pipe74AInputMeter.csv', 'pipe74BInput.csv'],
		responseCode: [200, 400],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe74: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe74 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 3; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe74</li></ol>']
	},
	pipe75: {
		description: 'Create meter with decreasing with reading upload',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip', false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe75').field('gzip', false)"],
		fileName: ['pipe75AInputMeter.csv', 'pipe75BInput.csv'],
		responseCode: [200, 200],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2>']
	},
	pipe76: {
		description: 'Create meter with end only with reading upload',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip',false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe76').field('gzip',false)"],
		fileName: ['pipe76AInputMeter.csv', 'pipe76BInput.csv'],
		responseCode: [200, 400],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe76: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing only with endTimestamps.<br>For reading #1 on meter pipe76 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 1970-01-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime true<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe76</li></ol>']
	},
	pipe80: {
		description: 'Two meter uploads where second sets cumulative with reading upload; all without headers',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('gzip', false)", CHAI_METERS_REQUEST + ".field('gzip', false).field('update',true).field('meterIdentifier', 'pipe80')", CHAI_READINGS_REQUEST + ".field('gzip', false).field('meterIdentifier', 'pipe80')"],
		fileName: ['pipe80AInputMeter.csv', 'pipe80BInputMeter.csv', 'pipe80CInput.csv'],
		responseCode: [200, 200, 400],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe80: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe80 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe80</li></ol>']
	},
	pipe90: {
		description: 'Two meter uploads with header and zipped where second sets cumulative & reset, renames meter then reading upload',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true)", CHAI_METERS_REQUEST + ".field('headerRow',true).field('update',true).field('meterIdentifier', 'pipe90x')", CHAI_READINGS_REQUEST + ".field('gzip', false).field('meterIdentifier', 'pipe90')"],
		fileName: ['pipe90AInputMeter.csv.gz', 'pipe90BInputMeter.csv.gz', 'pipe90CInput.csv'],
		responseCode: [200, 200, 400],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe90: Error parsing Reading #1. Reading value gives 24 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe90 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 24 start time 2021-06-01T00:00:00Z end time 2021-06-02T00:00:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset true; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe90</li></ol>']
	},
	pipe110: {
		description: 'Create meter with timezone with hourly reading upload into DST',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip', false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe110').field('honorDst', true).field('gzip', false)"],
		fileName: ['pipe110AInputMeter.csv', 'pipe110BInput.csv'],
		responseCode: [200, 200],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2><h3>However, note that the processing of the readings returned these warning(s):</h3><br>For meter pipe110: Warning parsing Reading #2. Reading value gives 120 with warning message:<br>Reading #2 crossed into daylight savings so it needs to be split where the first part is now being used. The original reading had startTimestamp of 2022-03-13T01:00:00-06:00 endTimestamp of 2022-03-13T03:00:00-05:00 reading value of 120 and the first part has a startTimestamp of 2022-03-13T01:00:00Z endTimestamp of 2022-03-13T02:00:00Z reading value of 120. This is only a notification and should not be an issue.<br>For reading #2 on meter pipe110 in pipeline: previous reading has value 60 start time 2022-03-13T00:00:00Z end time 2022-03-13T01:00:00Z and current reading has value 120 start time 2022-03-13T02:00:00Z end time 2022-03-13T03:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br>']
	},
	pipe111: {
		description: 'Create meter with timezone with daily reading upload into DST',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip', false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe111').field('honorDst', true).field('gzip', false)"],
		fileName: ['pipe111AInputMeter.csv', 'pipe111BInput.csv'],
		responseCode: [200, 200],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2><h3>However, note that the processing of the readings returned these warning(s):</h3><br>For meter pipe111: Warning parsing Reading #2. Reading value gives 2760 with warning message:<br>Reading #2 crossed into daylight savings so it needs to be split where the first part is now being used. The original reading had startTimestamp of 2022-03-13T00:00:00-06:00 endTimestamp of 2022-03-14T00:00:00-05:00 reading value of 2760 and the first part has a startTimestamp of 2022-03-13T00:00:00Z endTimestamp of 2022-03-13T02:00:00Z reading value of 240. This is only a notification and should not be an issue.<br>Reading #2 crossed into daylight savings so it needs to be split where the second part is now being used. The original reading had startTimestamp of 2022-03-13T00:00:00-06:00 endTimestamp of 2022-03-14T00:00:00-05:00 reading value of 2760 and the second part has a startTimestamp of 2022-03-13T03:00:00Z endTimestamp of 2022-03-14T00:00:00Z reading value of 2520. This is only a notification and should not be an issue.<br>For reading #2 on meter pipe111 in pipeline: previous reading has value 1440 start time 2022-03-12T00:00:00Z end time 2022-03-13T00:00:00Z and current reading has value 2760 start time 2022-03-13T00:00:00Z end time 2022-03-14T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br>']
	},
	pipe112: {
		description: 'Create meter with timezone with 15-minute reading upload into DST',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip', false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe112').field('honorDst', true).field('gzip', false)"],
		fileName: ['pipe112AInputMeter.csv', 'pipe112BInput.csv'],
		responseCode: [200, 200],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2><h3>However, note that the processing of the readings returned these warning(s):</h3><br>For meter pipe112: Warning parsing Reading #2. Reading value gives 30 with warning message:<br>Reading #2 crossed into daylight savings so it needs to be split where the first part is now being used. The original reading had startTimestamp of 2022-03-13T01:45:00-06:00 endTimestamp of 2022-03-13T03:00:00-05:00 reading value of 30 and the first part has a startTimestamp of 2022-03-13T01:45:00Z endTimestamp of 2022-03-13T02:00:00Z reading value of 30. This is only a notification and should not be an issue.<br>For reading #2 on meter pipe112 in pipeline: previous reading has value 15 start time 2022-03-13T01:30:00Z end time 2022-03-13T01:45:00Z and current reading has value 30 start time 2022-03-13T02:45:00Z end time 2022-03-13T03:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br>']
	},
	pipe113: {
		description: 'Create meter with timezone with 23-minute reading upload into DST',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip', false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe113').field('honorDst', true).field('gzip', false)"],
		fileName: ['pipe113AInputMeter.csv', 'pipe113BInput.csv'],
		responseCode: [200, 200],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2><h3>However, note that the processing of the readings returned these warning(s):</h3><br>For meter pipe113: Warning parsing Reading #2. Reading value gives 46 with warning message:<br>Reading #2 crossed into daylight savings so it needs to be split where the first part is now being used. The original reading had startTimestamp of 2022-03-13T01:46:00-06:00 endTimestamp of 2022-03-13T03:09:00-05:00 reading value of 46 and the first part has a startTimestamp of 2022-03-13T01:46:00Z endTimestamp of 2022-03-13T02:00:00Z reading value of 28. This is only a notification and should not be an issue.<br>Reading #2 crossed into daylight savings so it needs to be split where the second part is now being used. The original reading had startTimestamp of 2022-03-13T01:46:00-06:00 endTimestamp of 2022-03-13T03:09:00-05:00 reading value of 46 and the second part has a startTimestamp of 2022-03-13T03:00:00Z endTimestamp of 2022-03-13T03:09:00Z reading value of 18. This is only a notification and should not be an issue.<br>For reading #2 on meter pipe113 in pipeline: previous reading has value 23 start time 2022-03-13T01:23:00Z end time 2022-03-13T01:46:00Z and current reading has value 46 start time 2022-03-13T02:46:00Z end time 2022-03-13T03:09:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br>']
	},
	pipe114: {
		description: 'Create cumulative meter with timezone with 23-minute reading upload into DST',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip', false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe114').field('honorDst', true).field('cumulative',true).field('gzip', false)"],
		fileName: ['pipe114AInputMeter.csv', 'pipe114BInput.csv'],
		responseCode: [200, 400],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe114: Error parsing Reading #1. Reading value gives 0 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe114 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 0 start time 2022-03-13T01:00:00Z end time 2022-03-13T01:23:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe114: Warning parsing Reading #3. Reading value gives 46 with warning message:<br>Reading #3 crossed into daylight savings so it needs to be split where the first part is now being used. The original reading had startTimestamp of 2022-03-13T01:46:00-06:00 endTimestamp of 2022-03-13T03:09:00-05:00 reading value of 46 and the first part has a startTimestamp of 2022-03-13T01:46:00Z endTimestamp of 2022-03-13T02:00:00Z reading value of 28. This is only a notification and should not be an issue.<br>Reading #3 crossed into daylight savings so it needs to be split where the second part is now being used. The original reading had startTimestamp of 2022-03-13T01:46:00-06:00 endTimestamp of 2022-03-13T03:09:00-05:00 reading value of 46 and the second part has a startTimestamp of 2022-03-13T03:00:00Z endTimestamp of 2022-03-13T03:09:00Z reading value of 18. This is only a notification and should not be an issue.<br>For reading #3 on meter pipe114 in pipeline: previous reading has value 23 start time 2022-03-13T01:23:00Z end time 2022-03-13T01:46:00Z and current reading has value 46 start time 2022-03-13T02:46:00Z end time 2022-03-13T03:09:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe114</li></ol>']
	},
	pipe115: {
		description: 'Create meter with timezone with end-only reading upload into DST',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip', false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe115').field('honorDst', true).field('endOnly', true).field('gzip', false)"],
		fileName: ['pipe115AInputMeter.csv', 'pipe115BInput.csv'],
		responseCode: [200, 400],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe115: Error parsing Reading #1. Reading value gives -99 with error message:<br>The first ever reading must be dropped when dealing only with endTimestamps.<br>For reading #1 on meter pipe115 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value -99 start time 1970-01-01T00:00:00Z end time 2022-03-13T01:23:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime true<br><br>For meter pipe115: Warning parsing Reading #3. Reading value gives 46 with warning message:<br>Reading #3 crossed into daylight savings so it needs to be split where the first part is now being used. The original reading had startTimestamp of 2022-03-13T01:46:00-06:00 endTimestamp of 2022-03-13T03:09:00-05:00 reading value of 46 and the first part has a startTimestamp of 2022-03-13T01:46:00Z endTimestamp of 2022-03-13T02:00:00Z reading value of 28. This is only a notification and should not be an issue.<br>Reading #3 crossed into daylight savings so it needs to be split where the second part is now being used. The original reading had startTimestamp of 2022-03-13T01:46:00-06:00 endTimestamp of 2022-03-13T03:09:00-05:00 reading value of 46 and the second part has a startTimestamp of 2022-03-13T03:00:00Z endTimestamp of 2022-03-13T03:09:00Z reading value of 18. This is only a notification and should not be an issue.<br>For reading #3 on meter pipe115 in pipeline: previous reading has value 23 start time 2022-03-13T01:23:00Z end time 2022-03-13T02:46:00Z and current reading has value 46 start time 2022-03-13T02:46:00Z end time 2022-03-13T03:09:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime true<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe115</li></ol>']
	},
	pipe116: {
		description: 'Create meter with timezone with hourly reading upload from DST',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip', false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe116').field('honorDst', true).field('gzip', false)"],
		fileName: ['pipe116AInputMeter.csv', 'pipe116BInput.csv'],
		responseCode: [200, 400],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe116: Error parsing Reading #2. Reading value gives -1 with error message:<br>This reading is entirely within the shift time from daylight savings to standard time so it is dropped. The dropped reading  had startTimestamp of 2022-11-06T01:00:00-05:00 and endTimestamp of 2022-11-06T01:00:00-06:00 and value of -1. This should not be an issue but the reading is lost.<br>For reading #2 on meter pipe116 in pipeline: previous reading has value 60 start time 2022-11-06T00:00:00Z end time 2022-11-06T01:00:00Z and current reading has value -1 start time 2022-11-06T00:00:00Z end time 2022-11-06T01:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe116: Warning parsing Reading #3. Reading value gives 120 with warning message:<br>This or a previous reading crossed from daylight savings time and is the first one that does not entirely overlap a previous reading so its reading will be prorated where the original values were: startTimestamp of 2022-11-06T01:00:00-06:00 endTimestamp of 2022-11-06T02:00:00-06:00 reading value of 120. The used part has startTimestamp of 2022-11-06T01:00:00Z and endTimestamp of 2022-11-06T02:00:00Z and value of 120. This is only a notification and should not be an issue.<br>For reading #3 on meter pipe116 in pipeline: previous reading has value -1 start time 2022-11-06T00:00:00Z end time 2022-11-06T01:00:00Z and current reading has value 120 start time 2022-11-06T01:00:00Z end time 2022-11-06T02:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #2 for meter pipe116</li></ol>']
	},
	pipe117: {
		description: 'Create meter with timezone with daily reading upload from DST',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip', false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe117').field('honorDst', true).field('gzip', false)"],
		fileName: ['pipe117AInputMeter.csv', 'pipe117BInput.csv'],
		responseCode: [200, 200],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2><h3>However, note that the processing of the readings returned these warning(s):</h3><br>For meter pipe117: Warning parsing Reading #2. Reading value gives 2880 with warning message:<br>This or a previous reading crossed from daylight savings time and is the first one that does not entirely overlap a previous reading so its reading will be prorated where the original values were: startTimestamp of 2022-11-06T00:00:00-05:00 endTimestamp of 2022-11-07T00:00:00-06:00 reading value of 3000. The used part has startTimestamp of 2022-11-06T00:00:00Z and endTimestamp of 2022-11-07T00:00:00Z and value of 2880. This is only a notification and should not be an issue.<br>For reading #2 on meter pipe117 in pipeline: previous reading has value 1440 start time 2022-11-05T00:00:00Z end time 2022-11-06T00:00:00Z and current reading has value 2880 start time 2022-11-06T00:00:00Z end time 2022-11-07T00:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br>']
	},
	pipe118: {
		description: 'Create meter with timezone with 15-minute reading upload from DST',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip', false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe118').field('honorDst', true).field('gzip', false)"],
		fileName: ['pipe118AInputMeter.csv', 'pipe118BInput.csv'],
		responseCode: [200, 400],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe118: Error parsing Reading #2. Reading value gives -1 with error message:<br>This reading is entirely within the shift time from daylight savings to standard time so it is dropped. The dropped reading  had startTimestamp of 2022-11-06T01:45:00-05:00 and endTimestamp of 2022-11-06T01:00:00-06:00 and value of -1. This should not be an issue but the reading is lost.<br>For reading #2 on meter pipe118 in pipeline: previous reading has value 15 start time 2022-11-06T01:30:00Z end time 2022-11-06T01:45:00Z and current reading has value -1 start time 2022-11-06T00:45:00Z end time 2022-11-06T01:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe118: Error parsing Reading #3. Reading value gives -2 with error message:<br>This reading is entirely within the shift time from daylight savings to standard time so it is dropped. The dropped reading  had startTimestamp of 2022-11-06T01:00:00-06:00 and endTimestamp of 2022-11-06T01:15:00-06:00 and value of -2. This should not be an issue but the reading is lost.<br>For reading #3 on meter pipe118 in pipeline: previous reading has value -1 start time 2022-11-06T00:45:00Z end time 2022-11-06T01:00:00Z and current reading has value -2 start time 2022-11-06T01:00:00Z end time 2022-11-06T01:15:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe118: Error parsing Reading #4. Reading value gives -3 with error message:<br>This reading is entirely within the shift time from daylight savings to standard time so it is dropped. The dropped reading  had startTimestamp of 2022-11-06T01:15:00-06:00 and endTimestamp of 2022-11-06T01:30:00-06:00 and value of -3. This should not be an issue but the reading is lost.<br>For reading #4 on meter pipe118 in pipeline: previous reading has value -2 start time 2022-11-06T01:00:00Z end time 2022-11-06T01:15:00Z and current reading has value -3 start time 2022-11-06T01:15:00Z end time 2022-11-06T01:30:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe118: Error parsing Reading #5. Reading value gives -4 with error message:<br>This reading is entirely within the shift time from daylight savings to standard time so it is dropped. The dropped reading  had startTimestamp of 2022-11-06T01:30:00-06:00 and endTimestamp of 2022-11-06T01:45:00-06:00 and value of -4. This should not be an issue but the reading is lost.<br>For reading #5 on meter pipe118 in pipeline: previous reading has value -3 start time 2022-11-06T01:15:00Z end time 2022-11-06T01:30:00Z and current reading has value -4 start time 2022-11-06T01:30:00Z end time 2022-11-06T01:45:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe118: Warning parsing Reading #6. Reading value gives 30 with warning message:<br>This or a previous reading crossed from daylight savings time and is the first one that does not entirely overlap a previous reading so its reading will be prorated where the original values were: startTimestamp of 2022-11-06T01:45:00-06:00 endTimestamp of 2022-11-06T02:00:00-06:00 reading value of 30. The used part has startTimestamp of 2022-11-06T01:45:00Z and endTimestamp of 2022-11-06T02:00:00Z and value of 30. This is only a notification and should not be an issue.<br>For reading #6 on meter pipe118 in pipeline: previous reading has value -4 start time 2022-11-06T01:30:00Z end time 2022-11-06T01:45:00Z and current reading has value 30 start time 2022-11-06T01:45:00Z end time 2022-11-06T02:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #2 for meter pipe118</li><li>Dropped Reading #3 for meter pipe118</li><li>Dropped Reading #4 for meter pipe118</li><li>Dropped Reading #5 for meter pipe118</li></ol>']
	},
	pipe119: {
		description: 'Create meter with timezone with 23-minute reading upload from DST',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip', false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe119').field('honorDst', true).field('gzip', false)"],
		fileName: ['pipe119AInputMeter.csv', 'pipe119BInput.csv'],
		responseCode: [200, 400],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe119: Error parsing Reading #2. Reading value gives -1 with error message:<br>This reading is entirely within the shift time from daylight savings to standard time so it is dropped. The dropped reading  had startTimestamp of 2022-11-06T01:46:00-05:00 and endTimestamp of 2022-11-06T01:09:00-06:00 and value of -1. This should not be an issue but the reading is lost.<br>For reading #2 on meter pipe119 in pipeline: previous reading has value 23 start time 2022-11-06T01:23:00Z end time 2022-11-06T01:46:00Z and current reading has value -1 start time 2022-11-06T00:46:00Z end time 2022-11-06T01:09:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe119: Error parsing Reading #3. Reading value gives -2 with error message:<br>This reading is entirely within the shift time from daylight savings to standard time so it is dropped. The dropped reading  had startTimestamp of 2022-11-06T01:09:00-06:00 and endTimestamp of 2022-11-06T01:32:00-06:00 and value of -2. This should not be an issue but the reading is lost.<br>For reading #3 on meter pipe119 in pipeline: previous reading has value -1 start time 2022-11-06T00:46:00Z end time 2022-11-06T01:09:00Z and current reading has value -2 start time 2022-11-06T01:09:00Z end time 2022-11-06T01:32:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe119: Warning parsing Reading #4. Reading value gives 18 with warning message:<br>This or a previous reading crossed from daylight savings time and is the first one that does not entirely overlap a previous reading so its reading will be prorated where the original values were: startTimestamp of 2022-11-06T01:32:00-06:00 endTimestamp of 2022-11-06T01:55:00-06:00 reading value of 46. The used part has startTimestamp of 2022-11-06T01:46:00Z and endTimestamp of 2022-11-06T01:55:00Z and value of 18. This is only a notification and should not be an issue.<br>For reading #4 on meter pipe119 in pipeline: previous reading has value -2 start time 2022-11-06T01:09:00Z end time 2022-11-06T01:32:00Z and current reading has value 18 start time 2022-11-06T01:32:00Z end time 2022-11-06T01:55:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #2 for meter pipe119</li><li>Dropped Reading #3 for meter pipe119</li></ol>']
	},
	pipe120: {
		description: 'Create cumulative meter with timezone with 23-minute reading upload from DST',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip', false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe120').field('honorDst', true).field('cumulative',true).field('gzip', false)"],
		fileName: ['pipe120AInputMeter.csv', 'pipe120BInput.csv'],
		responseCode: [200, 400],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe120: Error parsing Reading #1. Reading value gives 0 with error message:<br>The first ever reading must be dropped when dealing with cumulative data.<br>For reading #1 on meter pipe120 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value 0 start time 2022-11-06T01:00:00Z end time 2022-11-06T01:23:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe120: Error parsing Reading #3. Reading value gives 0 with error message:<br>This reading is entirely within the shift time from daylight savings to standard time so it is dropped. The dropped reading  had startTimestamp of 2022-11-06T01:46:00-05:00 and endTimestamp of 2022-11-06T01:09:00-06:00 and value of 0. This should not be an issue but the reading is lost.<br>For reading #3 on meter pipe120 in pipeline: previous reading has value 23 start time 2022-11-06T01:23:00Z end time 2022-11-06T01:46:00Z and current reading has value 0 start time 2022-11-06T00:46:00Z end time 2022-11-06T01:09:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe120: Error parsing Reading #4. Reading value gives 0 with error message:<br>This reading is entirely within the shift time from daylight savings to standard time so it is dropped. The dropped reading  had startTimestamp of 2022-11-06T01:09:00-06:00 and endTimestamp of 2022-11-06T01:32:00-06:00 and value of 0. This should not be an issue but the reading is lost.<br>For reading #4 on meter pipe120 in pipeline: previous reading has value 0 start time 2022-11-06T00:46:00Z end time 2022-11-06T01:09:00Z and current reading has value 0 start time 2022-11-06T01:09:00Z end time 2022-11-06T01:32:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter pipe120: Warning parsing Reading #5. Reading value gives 18 with warning message:<br>This or a previous reading crossed from daylight savings time and is the first one that does not entirely overlap a previous reading so its reading will be prorated where the original values were: startTimestamp of 2022-11-06T01:32:00-06:00 endTimestamp of 2022-11-06T01:55:00-06:00 reading value of 46. The used part has startTimestamp of 2022-11-06T01:46:00Z and endTimestamp of 2022-11-06T01:55:00Z and value of 18. This is only a notification and should not be an issue.<br>For reading #5 on meter pipe120 in pipeline: previous reading has value 0 start time 2022-11-06T01:09:00Z end time 2022-11-06T01:32:00Z and current reading has value 18 start time 2022-11-06T01:32:00Z end time 2022-11-06T01:55:00Z with timeSort increasing; duplications 1; cumulative true; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe120</li><li>Dropped Reading #3 for meter pipe120</li><li>Dropped Reading #4 for meter pipe120</li></ol>']
	},
	pipe121: {
		description: 'Create end-only meter with timezone with 23-minute reading upload from DST',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip', false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe121').field('honorDst', true).field('endOnly', true).field('gzip', false)"],
		fileName: ['pipe121AInputMeter.csv', 'pipe121BInput.csv'],
		responseCode: [200, 400],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe121: Error parsing Reading #1. Reading value gives -99 with error message:<br>The first ever reading must be dropped when dealing only with endTimestamps.<br>For reading #1 on meter pipe121 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value -99 start time 1970-01-01T00:00:00Z end time 2022-11-06T01:23:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime true<br><br>For meter pipe121: Error parsing Reading #3. Reading value gives -1 with error message:<br>This reading is entirely within the shift time from daylight savings to standard time so it is dropped. The dropped reading  had startTimestamp of 2022-11-06T01:46:00-05:00 and endTimestamp of 2022-11-06T01:09:00-06:00 and value of -1. This should not be an issue but the reading is lost.<br>For reading #3 on meter pipe121 in pipeline: previous reading has value 23 start time 2022-11-06T01:23:00Z end time 2022-11-06T01:46:00Z and current reading has value -1 start time 2022-11-06T00:46:00Z end time 2022-11-06T01:09:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime true<br><br>For meter pipe121: Error parsing Reading #4. Reading value gives -2 with error message:<br>This reading is entirely within the shift time from daylight savings to standard time so it is dropped. The dropped reading  had startTimestamp of 2022-11-06T01:09:00-06:00 and endTimestamp of 2022-11-06T01:32:00-06:00 and value of -2. This should not be an issue but the reading is lost.<br>For reading #4 on meter pipe121 in pipeline: previous reading has value -1 start time 2022-11-06T00:46:00Z end time 2022-11-06T01:09:00Z and current reading has value -2 start time 2022-11-06T01:09:00Z end time 2022-11-06T01:32:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime true<br><br>For meter pipe121: Warning parsing Reading #5. Reading value gives 18 with warning message:<br>This or a previous reading crossed from daylight savings time and is the first one that does not entirely overlap a previous reading so its reading will be prorated where the original values were: startTimestamp of 2022-11-06T01:32:00-06:00 endTimestamp of 2022-11-06T01:55:00-06:00 reading value of 46. The used part has startTimestamp of 2022-11-06T01:46:00Z and endTimestamp of 2022-11-06T01:55:00Z and value of 18. This is only a notification and should not be an issue.<br>For reading #5 on meter pipe121 in pipeline: previous reading has value -2 start time 2022-11-06T01:09:00Z end time 2022-11-06T01:32:00Z and current reading has value 18 start time 2022-11-06T01:32:00Z end time 2022-11-06T01:55:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime true<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe121</li><li>Dropped Reading #3 for meter pipe121</li><li>Dropped Reading #4 for meter pipe121</li></ol>']
	},
	pipe122: {
		description: 'Create end-only meter with timezone with two 23-minute reading upload from DST',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip', false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe122').field('honorDst', true).field('endOnly', true).field('gzip', false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe122').field('honorDst', true).field('endOnly', true).field('gzip', false)"],
		fileName: ['pipe122AInputMeter.csv', 'pipe122BInput.csv', 'pipe122CInput.csv'],
		responseCode: [200, 400, 400],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe122: Error parsing Reading #1. Reading value gives -99 with error message:<br>The first ever reading must be dropped when dealing only with endTimestamps.<br>For reading #1 on meter pipe122 in pipeline: previous reading has value 0 start time 1970-01-01T00:00:00Z end time 1970-01-01T00:00:00Z and current reading has value -99 start time 1970-01-01T00:00:00Z end time 2022-11-06T01:23:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime true<br><br>For meter pipe122: Error parsing Reading #3. Reading value gives -1 with error message:<br>This reading is entirely within the shift time from daylight savings to standard time so it is dropped. The dropped reading  had startTimestamp of 2022-11-06T01:46:00-05:00 and endTimestamp of 2022-11-06T01:09:00-06:00 and value of -1. This should not be an issue but the reading is lost.<br>For reading #3 on meter pipe122 in pipeline: previous reading has value 23 start time 2022-11-06T01:23:00Z end time 2022-11-06T01:46:00Z and current reading has value -1 start time 2022-11-06T00:46:00Z end time 2022-11-06T01:09:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime true<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe122</li><li>Dropped Reading #3 for meter pipe122</li></ol>', '<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter pipe122: Error parsing Reading #1. Reading value gives -2 with error message:<br>This reading is entirely within the shift time from daylight savings to standard time so it is dropped. The dropped reading  had startTimestamp of 2022-11-06T01:09:00-06:00 and endTimestamp of 2022-11-06T01:32:00-06:00 and value of -2. This should not be an issue but the reading is lost.<br>For reading #1 on meter pipe122 in pipeline: previous reading has value -1 start time 2022-11-06T01:46:00Z end time 2022-11-06T01:09:00Z and current reading has value -2 start time 2022-11-06T01:09:00Z end time 2022-11-06T01:32:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime true<br><br>For meter pipe122: Warning parsing Reading #2. Reading value gives 18 with warning message:<br>This or a previous reading crossed from daylight savings time and is the first one that does not entirely overlap a previous reading so its reading will be prorated where the original values were: startTimestamp of 2022-11-06T01:32:00-06:00 endTimestamp of 2022-11-06T01:55:00-06:00 reading value of 46. The used part has startTimestamp of 2022-11-06T01:46:00Z and endTimestamp of 2022-11-06T01:55:00Z and value of 18. This is only a notification and should not be an issue.<br>For reading #2 on meter pipe122 in pipeline: previous reading has value -2 start time 2022-11-06T01:09:00Z end time 2022-11-06T01:32:00Z and current reading has value 18 start time 2022-11-06T01:32:00Z end time 2022-11-06T01:55:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime true<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #1 for meter pipe122</li></ol>']
	},
	pipe123: {
		description: 'Create meter with timezone with 30-minute reading with gap upload from DST',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow',true).field('gzip', false)", CHAI_READINGS_REQUEST + ".field('meterIdentifier','pipe123').field('honorDst', true).field('gzip', false)"],
		fileName: ['pipe123AInputMeter.csv', 'pipe123BInput.csv'],
		responseCode: [200, 200],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2><h3>However, note that the processing of the readings returned these warning(s):</h3><br>For meter pipe123: Warning parsing Reading #2. Reading value gives 30 with warning message:<br>The reading start time is shifted and within the DST shift so it is possible that the crossing to standard time was missed and readings overlap. The current reading startTime is not after the previous reading\'s end time. Note this is treated only as a warning since readings may be sent out of order.<br>There is a gap in time between this reading and the previous reading that exceeds the allowed amount of 0 seconds.<br>For reading #2 on meter pipe123 in pipeline: previous reading has value 15 start time 2022-11-06T01:25:00Z end time 2022-11-06T01:55:00Z and current reading has value 30 start time 2022-11-06T01:30:00Z end time 2022-11-06T02:00:00Z with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br>']
	},
	pipe130: {
		description: 'Testing Readings Upload using Email',
		chaiRequest: [CHAI_READINGS_REQUEST_EMAIL + ".field('meterIdentifier', 'pipe130').field('gzip', false)"],
		fileName: ['pipe130Input.csv'],
		createMeter: true,
		responseCode: [200],
		responseString: ['<h1>SUCCESS</h1><h2>It looks like the insert of the readings was a success.</h2>']
	}
}

for (let fileKey in testCases) {
	mocha.describe('Test CSV Pipeline', () => {
		mocha.beforeEach(async () => {
			const conn = testDB.getConnection();
			// Create standard units/conversions as a normal OED setup.
			await insertStandardUnits(conn);
			await insertStandardConversions(conn);
			// Create needed units for meters.
			const units = [
				{
					name: 'Electric_Utility',
					identifier: '',
					unitRepresent: Unit.unitRepresentType.QUANTITY,
					secInRate: 3600,
					typeOfUnit: Unit.unitType.METER,
					suffix: '',
					displayable: Unit.displayableType.NONE,
					preferredDisplay: false,
					note: 'for testing'
				}
			];
			await insertUnits(units, false, conn);
			// Create conversions from meter units to standard units.
			const conversions = [
				{
					sourceName: 'Electric_Utility',
					destinationName: 'kWh',
					bidirectional: false,
					slope: 1,
					intercept: 0,
					note: 'Electric_Utility → kWh'
				},
			];
			await insertConversions(conversions, conn);
			// Recreate the Cik entries since changed units/conversions.
			await redoCik(conn);
			// We don't need to refresh views since we get readings directly from DB readings table.
		});
		const numUploads = testCases[fileKey].chaiRequest.length;
		mocha.it(`Testing files starting '${fileKey}' doing '${testCases[fileKey]['description']}' with ${numUploads} requests`, async () => {
			let expectedFile = `${fileKey}Expected.csv`;
			let expectedPath = `${__dirname}/csvPipeline/${expectedFile}`;
			let expectedBuffer = fs.readFileSync(expectedPath);
			const conn = testDB.getConnection();
			for (let index = 0; index < numUploads; index++) {
				// It would be nice to put a mocha.describe inside the loop to tell the upload starting
				// but that breaks the tests.
				// Each set of uploads must be in one mocha because the DB is reset with each test.
				if (index == 0 && testCases[fileKey].hasOwnProperty('createMeter') && testCases[fileKey]['createMeter']) {
					// The key to create meter is present and true so create the meter if first request.
					const meter = new Meter(
						undefined, // id
						fileKey, // name
						undefined, // url
						false, // enabled
						false, // displayable
						Meter.type.OTHER, // type
						null, // timezone
					)
					meter.insert(conn);
				}
				let inputFile = testCases[fileKey]['fileName'][index];
				let inputPath = `${__dirname}/csvPipeline/${inputFile}`;
				let inputBuffer = fs.readFileSync(inputPath);
				let evalString = `${testCases[fileKey]['chaiRequest'][index]}.attach('csvfile', inputBuffer, '${inputPath}')`;
				// TODO It would be nice if this was not an eval. Tried a function with closure but could not get it to work as did not find chai.
				const res = await eval(evalString);
				expect(res).to.have.status(testCases[fileKey]['responseCode'][index]);
				expect(res).to.be.html;
				// OED returns a string with messages that we check it is what was expected.
				expect(res.text).to.equal(testCases[fileKey]['responseString'][index]);
			}
			// You do not want to check the database until all the uploads are done.
			// Get every meter to be sure only one with correct name.
			const meters = await Meter.getAll(conn);
			expect(meters.length).to.equal(1);
			expect(meters[0].name).to.equal(fileKey);
			const readings = await Reading.getAllByMeterID(meters[0].id, conn);
			const extractedReadings = readings.map(reading => {
				return [`${reading.reading}`, reading.startTimestamp.format('YYYY-MM-DD HH:mm:ss'), reading.endTimestamp.format('YYYY-MM-DD HH:mm:ss')];
			});
			const fileReadings = await parseCsv(expectedBuffer);
			expect(extractedReadings).to.deep.equals(fileReadings);
		});
	});
}

// Begin testing of meters.

// The GPS value used when want one. Note that OED stores the point as (Longitude, Latitude) so the order is reversed from the CSV file.
const gps = new Point(50, 25);

/*
The structure has
The highest level has the name of the test. Each one is a test to run.
description: tells what the test is doing. There is one for all uploads so it is not an array.
chaiRequest: an array of the requests that will be made.
fileName: an array of the names of the files to use.
responseCode: an array of the code sent back by OED for each request.
responseString: an array of the html text sent back by OED for each request.
metersUpload: an array where each entry is a meter object that is what should be in the database.
*/
const testMeters = {
	pipe100: {
		description: 'Second meter upload where incorrectly provides meter identifier so fails',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('gzip', false).field('headerRow',true)", CHAI_METERS_REQUEST + ".field('gzip', false).field('update',true).field('meterIdentifier', 'pipe100').field('headerRow',true)"],
		fileName: ['pipe100InputMeter.csv', 'pipe100InputMeter.csv'],
		responseCode: [200, 400],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>FAILURE</h1>CSVPipelineError: Failed to upload meters due to internal OED Error: Meter identifier provided ("pipe100") in request with update for meters but more than one meter in CSV so not processing'],
		metersUploaded: [
			new Meter(
				undefined, // id
				'pipe100', // name
				null, // URL
				false, // enabled
				false, //displayable
				'other', //type
				null, // timezone
				undefined, // gps
				undefined, // identifier
				null, // note
				undefined, //area
				undefined, // cumulative
				undefined, //cumulativeReset
				undefined, // cumulativeResetStart
				undefined, // cumulativeResetEnd
				undefined, // readingGap
				undefined, // readingVariation
				undefined, //readingDuplication
				undefined, // timeSort
				undefined, //endOnlyTime
				undefined, // reading
				undefined, // startTimestamp
				undefined, // endTimestamp
				undefined, // previousEnd
				undefined, // unitId
				undefined, // defaultGraphicUnit
				undefined, // area unit
				undefined // reading frequency
			),
			new Meter(
				undefined, // id
				'pipe100b', // name
				'123.45.6.0', // URL
				true, // enabled
				true, //displayable
				'obvius', //type
				'US/Central', // timezone
				// null, // timezone
				gps, // gps
				'pipe100b id', // identifier
				'my Note', // note
				33, //area
				true, // cumulative
				true, //cumulativeReset
				'14:44:00', // cumulativeResetStart
				'15:55:00', // cumulativeResetEnd
				12.34, // readingGap
				56.78, // readingVariation
				7, //readingDuplication
				'decreasing', // timeSort
				true, //endOnlyTime
				89.90, // reading
				'1666-07-08 17:13:19', // startTimestamp
				'1777-08-09 05:07:11', // endTimestamp
				'1888-09-10 11:12:13+00:00', // previousEnd
				undefined, // unitId
				undefined, // defaultGraphicUnit
				Unit.areaUnitType.METERS,// area unit
				undefined // reading frequency
			)
		]
	},
	pipe101: {
		description: 'Second meter with same name so fails but first meter exists',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('gzip', false).field('headerRow',true)"],
		fileName: ['pipe101InputMeter.csv'],
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1>CSVPipelineError: Failed to upload meters due to internal OED Error: Meter name of "pipe101" got database error of: duplicate key value violates unique constraint "meters_name_key"'],
		metersUploaded: [
			new Meter(
				undefined, // id
				'pipe101', // name
				null, // URL
				false, // enabled
				false, //displayable
				'other', //type
				null, // timezone
				undefined, // gps
				undefined, // identifier
				null, // note
				undefined, //area
				undefined, // cumulative
				undefined, //cumulativeReset
				undefined, // cumulativeResetStart
				undefined, // cumulativeResetEnd
				undefined, // readingGap
				undefined, // readingVariation
				undefined, //readingDuplication
				undefined, // timeSort
				undefined, //endOnlyTime
				undefined, // reading
				undefined, // startTimestamp
				undefined, // endTimestamp
				undefined, // previousEnd
				undefined, // unitId
				undefined, // defaultGraphicUnit
				undefined, // area unit
				undefined // reading frequency
			)
		]
	},
	pipe102: {
		description: 'Update meter where name does not exist so fails',
		chaiRequest: [CHAI_METERS_REQUEST + ".field('gzip', false).field('headerRow',true).field('update',true)"],
		fileName: ['pipe102InputMeter.csv'],
		responseCode: [400],
		responseString: ['<h1>FAILURE</h1>CSVPipelineError: Failed to upload meters due to internal OED Error: Meter identifier of "pipe102" does not seem to exist with update for meters and got DB error of: No data returned from the query.'],
		metersUploaded: []
	},
	pipe103: {
		description: 'Uploading meters using Email. First succeeds then the second meter upload fails because it incorrectly provides meter identifier',
		chaiRequest: [CHAI_METERS_REQUEST_EMAIL + ".field('gzip', false).field('headerRow',true)", CHAI_METERS_REQUEST_EMAIL + ".field('gzip', false).field('update',true).field('meterIdentifier', 'pipe100').field('headerRow',true)"],
		fileName: ['pipe100InputMeter.csv', 'pipe100InputMeter.csv'],
		responseCode: [200, 400],
		responseString: ['<h1>SUCCESS</h1>Successfully inserted the meters.', '<h1>FAILURE</h1>CSVPipelineError: Failed to upload meters due to internal OED Error: Meter identifier provided ("pipe100") in request with update for meters but more than one meter in CSV so not processing'],
		metersUploaded: [
			new Meter(
				undefined, // id
				'pipe100', // name
				null, // URL
				false, // enabled
				false, //displayable
				'other', //type
				null, // timezone
				undefined, // gps
				undefined, // identifier
				null, // note
				undefined, //area
				undefined, // cumulative
				undefined, //cumulativeReset
				undefined, // cumulativeResetStart
				undefined, // cumulativeResetEnd
				undefined, // readingGap
				undefined, // readingVariation
				undefined, //readingDuplication
				undefined, // timeSort
				undefined, //endOnlyTime
				undefined, // reading
				undefined, // startTimestamp
				undefined, // endTimestamp
				undefined, // previousEnd
				undefined, // unitId
				undefined, // defaultGraphicUnit
				undefined, // area unit
				undefined // reading frequency
			),
			new Meter(
				undefined, // id
				'pipe100b', // name
				'123.45.6.0', // URL
				true, // enabled
				true, //displayable
				'obvius', //type
				'US/Central', // timezone
				// null, // timezone
				gps, // gps
				'pipe100b id', // identifier
				'my Note', // note
				33, //area
				true, // cumulative
				true, //cumulativeReset
				'14:44:00', // cumulativeResetStart
				'15:55:00', // cumulativeResetEnd
				12.34, // readingGap
				56.78, // readingVariation
				7, //readingDuplication
				'decreasing', // timeSort
				true, //endOnlyTime
				89.90, // reading
				'1666-07-08 17:13:19', // startTimestamp
				'1777-08-09 05:07:11', // endTimestamp
				'1888-09-10 11:12:13+00:00', // previousEnd
				undefined, // unitId
				undefined, // defaultGraphicUnit
				Unit.areaUnitType.METERS,// area unit
				undefined // reading frequency
			)
		]
	}
}

// Loop over all the meter tests.
for (let fileKey in testMeters) {
	mocha.describe('Test CSV meter Pipeline', () => {
		let meterUnit, graphUnit;
		mocha.beforeEach(async () => {
			const conn = testDB.getConnection();
			// Create needed units for meters.
			const units = [
				{
					name: 'Electric_Utility',
					identifier: '',
					unitRepresent: Unit.unitRepresentType.QUANTITY,
					secInRate: 3600,
					typeOfUnit: Unit.unitType.METER,
					suffix: '',
					displayable: Unit.displayableType.NONE,
					preferredDisplay: false,
					note: 'for teting'
				},
				{
					name: 'kWh',
					identifier: '',
					unitRepresent: Unit.unitRepresentType.QUANTITY,
					secInRate: 3600,
					typeOfUnit: Unit.unitType.UNIT,
					suffix: '',
					displayable: Unit.displayableType.ALL,
					preferredDisplay: true,
					note: 'for testing'
				}
			];
			await insertUnits(units, false, conn);
			// Get the value from the DB so can get the id.
			meterUnit = await Unit.getByName('Electric_Utility', conn);
			graphUnit = await Unit.getByName('kWh', conn);
		});
		// How many uploads will be done.
		const numUploads = testMeters[fileKey].chaiRequest.length;
		mocha.it(`Meter testing files starting '${fileKey}' doing '${testMeters[fileKey]['description']}' with ${numUploads} requests`, async () => {
			const conn = testDB.getConnection();
			// The first test, second meter needs to have the ids for units put to what they actually are.
			// Cannot do above since not inserted into DB until the beforeEach().
			if (fileKey === 'pipe100' || fileKey === 'pipe103') {
				testMeters[fileKey]['metersUploaded'][1].unitId = meterUnit.id;
				testMeters[fileKey]['metersUploaded'][1].defaultGraphicUnit = graphUnit.id;
			}
			// Loop over each upload to perform it.
			for (let index = 0; index < numUploads; index++) {
				// It would be nice to put a mocha.describe inside the loop to tell the upload starting
				// but that breaks the tests.
				// Each set of uploads must be in one mocha because the DB is reset with each test.
				// The CSV file name with the meter data.
				let inputFile = testMeters[fileKey]['fileName'][index];
				// The CSV file with its path.
				let inputPath = `${__dirname}/csvPipeline/${inputFile}`;
				// The CSV file as an file buffer.
				let inputBuffer = fs.readFileSync(inputPath);
				// The Chai request string to do the upload.
				let evalString = `${testMeters[fileKey]['chaiRequest'][index]}.attach('csvfile', inputBuffer, '${inputPath}')`;
				// eval the string to perform the upload. res is what is returned from the request.
				// TODO It would be nice if this was not an eval. Tried a function with closure but could not get it to work as did not find chai.
				const res = await eval(evalString);
				// Verify the request response code is what was expected.
				expect(res).to.have.status(testMeters[fileKey]['responseCode'][index]);
				// This is a web request that should return html.
				expect(res).to.be.html;
				// OED returns a string with messages that we check it is what was expected.
				expect(res.text).to.equal(testMeters[fileKey]['responseString'][index]);
			}
			// You do not want to check the database until all the uploads are done.
			// Get every meter to be sure the correct number is there.
			const meters = await Meter.getAll(conn);
			let numExpected = testMeters[fileKey]['metersUploaded'].length;
			expect(meters.length).to.equal(numExpected);
			// Loop over meters to see if correct values.
			for (let index = 0; index < numExpected; index++) {
				// The expected value for the meter.
				let expectMeter = testMeters[fileKey]['metersUploaded'][index];
				// Get the database value for the meter.
				let meter = await Meter.getByName(expectMeter.name, conn);
				// Verify they are the same.
				compareMeters(expectMeter, meter);
			}
		});
	});
}

// TODO It would be nice to make this use the code in src/server/test/db/meterTests.js and make
// all meter tests use one common function fo meter comparison.
/**
 * Compares the two provided meters to make sure they are the same.
 * @param {*} expectMeter A meter object that gives the values expected for the meter.
 * @param {*} receivedMeter A meter object that has the actual values (normally from database).
 */
function compareMeters(expectMeter, receivedMeter) {
	// Make sure it has all the expected properties with the values expected.
	expect(receivedMeter).to.have.property('name', expectMeter.name);
	expect(receivedMeter).to.have.property('url', expectMeter.url);
	expect(receivedMeter).to.have.property('enabled', expectMeter.enabled);
	expect(receivedMeter).to.have.property('displayable', expectMeter.displayable);
	expect(receivedMeter).to.have.property('type', expectMeter.type);
	expect(receivedMeter).to.have.property('meterTimezone', expectMeter.meterTimezone);
	expect(receivedMeter).to.have.property('gps');
	// Only check GPS value if it exists.
	if (receivedMeter.gps !== null) {
		expect(receivedMeter.gps).to.have.property('latitude', expectMeter.gps.latitude);
		expect(receivedMeter.gps).to.have.property('longitude', expectMeter.gps.longitude);
	}
	expect(receivedMeter).to.have.property('identifier', expectMeter.identifier);
	expect(receivedMeter).to.have.property('note', expectMeter.note);
	expect(receivedMeter).to.have.property('area', expectMeter.area);
	expect(receivedMeter).to.have.property('cumulative', expectMeter.cumulative);
	expect(receivedMeter).to.have.property('cumulativeReset', expectMeter.cumulativeReset);
	expect(receivedMeter).to.have.property('cumulativeResetStart', expectMeter.cumulativeResetStart);
	expect(receivedMeter).to.have.property('cumulativeResetEnd', expectMeter.cumulativeResetEnd);
	expect(receivedMeter).to.have.property('readingGap', expectMeter.readingGap);
	expect(receivedMeter).to.have.property('readingVariation', expectMeter.readingVariation);
	expect(receivedMeter).to.have.property('readingDuplication', expectMeter.readingDuplication);
	expect(receivedMeter).to.have.property('timeSort', expectMeter.timeSort);
	expect(receivedMeter).to.have.property('endOnlyTime', expectMeter.endOnlyTime);
	expect(receivedMeter).to.have.property('reading', expectMeter.reading);
	expect(receivedMeter).to.have.property('startTimestamp', expectMeter.startTimestamp);
	expect(receivedMeter).to.have.property('endTimestamp', expectMeter.endTimestamp);
	expect(receivedMeter.previousEnd.isSame(moment.parseZone(expectMeter.previousEnd, true).tz('UTC', true))).to.equal(true);
	expect(receivedMeter).to.have.property('unitId', expectMeter.unitId);
	expect(receivedMeter).to.have.property('defaultGraphicUnit', expectMeter.defaultGraphicUnit);
	expect(receivedMeter).to.have.property('areaUnit', expectMeter.areaUnit);
}
