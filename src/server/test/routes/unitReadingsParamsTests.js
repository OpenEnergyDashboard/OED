/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { chai, mocha, expect, app } = require('../common');
const { HTTP_CODES } = require('../../util/httpCodes');
const sinon = require('sinon');
const moment = require('moment');
const Reading = require('../../models/Reading');
const { meterLineReadings,
	validateLineReadingsParams,
	validateLineReadingsQueryParams,
	meterBarReadings,
	validateMeterBarReadingsParams,
	validateBarReadingsQueryParams,
	meterThreeDReadings,
	groupThreeDReadings,
	validateMeterThreeDReadingsParams,
	validateGroupThreeDReadingsParams,
	validateThreeDQueryParams,
} = require('../../routes/unitReadings');

const {
	expectValidCommaSeparatedIds,
	validateCommaSeparatedIdPatterns,
	validateNumericIdInPath
} = require('../util/validationHelpers');

const { createTimeString } = require('../../util/readingsUtils');

const { TimeInterval } = require('../../../common/TimeInterval');

// TODO is this actually used anywhere?
function mockResponse() {
	return {
		sendStatus: sinon.spy(),
		json: sinon.spy()
	};
}

mocha.describe('unit readings routes', () => {
	mocha.describe('the line readings route', () => {
		const LINE_METERS_ENDPOINT = '/api/unitReadings/line/meters';
		const valid_query = { timeInterval: TimeInterval.unbounded().toString(), graphicUnitId: '99' }

		mocha.describe('Meter line readings validation', () => {
			mocha.it('fails to validate when the meter_ids param is wrong', async () => {
				await validateCommaSeparatedIdPatterns({
					baseEndpoint: LINE_METERS_ENDPOINT,
					invalidValues: [
						'abc',
						'1,',
						',1',
						'1,,2',
						'1;2',
						'1.5',
						'-1',
						'1 2',
					],
					query: valid_query,
					expectedStatuses: [HTTP_CODES.OK, HTTP_CODES.NOT_FOUND, HTTP_CODES.INTERNAL_SERVER_ERROR]
				});
			});
			mocha.it('validates when the meter_ids param is valid', async () => {
				await expectValidCommaSeparatedIds({
					baseEndpoint: LINE_METERS_ENDPOINT,
					validValues: ['1', '12', '1,2,3'],
					query: valid_query
				})
			});
		});

		// This needs to run the after() for this test so separated into its own describe since after works at that level. 
		mocha.describe('correct call', function () {
			// Used by the test and in after so needs to be at this scope.
			let readingsStub;

			mocha.after('restore sinon stub', function () {
				// If the original function isn't restored, It can break other tests in OED.
				// Use after() so restores even if test fails.
				readingsStub.restore();
			});

			mocha.it('returns line readings correctly when called correctly', async function () {
				// The moments in these tests all involve TimeInterval that converts to UTC
				// and not the DB so okay to use local timezone.
				const timeString = '2017-01-01T00:00:00.000Z_2017-01-02T00:00:00.000Z';
                const timeInterval = TimeInterval.fromString(timeString);

				// getMeterLineReadings is called by meterLineReadings. This makes it appear the result is what is given here.
				readingsStub = sinon.stub(Reading, 'getMeterLineReadings');
				readingsStub.resolves({
					1: [
						{ reading_rate: 1, min_rate: 1, max_rate: 1, start_timestamp: timeInterval.startTimestamp, end_timestamp: timeInterval.endTimestamp }
					]
				});

				const line_test_query = {
					timeInterval: timeString,
					graphicUnitId: '99'
				};

				const res = await chai.request(app)
					.get(`${LINE_METERS_ENDPOINT}/1`)
					.query(line_test_query);

				expect(res).to.have.status(HTTP_CODES.OK);

				const expectedResponse = {
					1: [
						{ reading: 1, min: 1, max: 1, startTimestamp: timeInterval.startTimestamp.valueOf(), endTimestamp: timeInterval.endTimestamp.valueOf() }
					]
				};
				expect(res.body).to.deep.equal(expectedResponse);
			});
		});
	});


	mocha.describe('the bar readings route', () => {
		const BAR_METERS_ENDPOINT = '/api/unitReadings/bar/meters';
		const valid_query = { timeInterval: TimeInterval.unbounded().toString(), barWidthDays: '28', graphicUnitId: '99' };

		mocha.describe('validation', () => {
			mocha.it('fails to validate when the meter_ids param is wrong', async () => {
				await validateCommaSeparatedIdPatterns({
					baseEndpoint: BAR_METERS_ENDPOINT,
					invalidValues: [
						'abc',
						'1,',
						',1',
						'1,,2',
						'1;2',
						'1.5',
						'-1',
						'1 2',
					],
					query: valid_query,
					expectedStatuses: [HTTP_CODES.OK, HTTP_CODES.NOT_FOUND, HTTP_CODES.INTERNAL_SERVER_ERROR]
				});
			});

			mocha.it('validates when the time interval is valid', async () => {
				await expectValidCommaSeparatedIds({
					baseEndpoint: BAR_METERS_ENDPOINT,
					validValues: ['1', '12', '1,2,3'],
					query: valid_query
				})
			});
		});


		// This needs to run the after() for this test so separated into its own describe since after works at that level. 
		mocha.describe('correct call', function () {
			// Used by the test and in after so needs to be at this scope.
			let readingsStub;

			mocha.after('restore sinon stub', function () {
				// If the original function isn't restored, It can break other tests in OED.
				// Use after() so restores even if test fails.
				readingsStub.restore();
			});

			mocha.it('returns bar readings correctly when called correctly', async () => {
				const timeString = '2017-01-01T00:00:00.000Z_2017-01-02T00:00:00.000Z';
                const timeInterval = TimeInterval.fromString(timeString);
				
				// getMeterBarReadings is called by meterBarReadings. This makes it appear the result is what is given here.
				readingsStub = sinon.stub(Reading, 'getMeterBarReadings');
				readingsStub.resolves({
					1: [
						{ reading: 1, start_timestamp: timeInterval.startTimestamp, end_timestamp: timeInterval.endTimestamp }
					]
				});

				const bar_test_query = {
					timeInterval: timeString,
					graphicUnitId: '99',
					barWidthDays: '1'
				};

				const res = await chai.request(app)
					.get(`${BAR_METERS_ENDPOINT}/1`)
					.query(bar_test_query);

				expect(res).to.has.status(HTTP_CODES.OK);

				const expectedResponse = {
					1: [
						{ reading: 1, startTimestamp: timeInterval.startTimestamp.valueOf(), endTimestamp: timeInterval.endTimestamp.valueOf() }
					]
				};

				expect(res.body).to.deep.equal(expectedResponse);
			});
		});
	});


	mocha.describe('the meter 3D readings route', () => {
		const THREE_D_METERS_ENDPOINT = '/api/unitReadings/threeD/meters';
		const valid_query = { timeInterval: createTimeString('2022-01-01', '00:00:00', '2023-01-01', '00:00:00'), graphicUnitId: '99', readingInterval: '1' }

		mocha.describe('validation', () => {
			mocha.it('fails to validate when the meter_ids param is wrong', async () => {
				await validateNumericIdInPath({
					baseEndpoint: THREE_D_METERS_ENDPOINT,
					invalidValues: [
						'abc',
						'1,',
						',1',
						'1,2',
						'1,,2',
						'1;2',
						'1.5',
						'-1',
						'1 2',
					],
					query: valid_query,
				});
			});
			mocha.it('validates when the time interval is valid', async () => {
				await expectValidCommaSeparatedIds({
					baseEndpoint: THREE_D_METERS_ENDPOINT,
					validValues: ['1', '12'],
					query: valid_query
				});
			});
		});

		// This needs to run the after() for this test so separated into its own describe since after works at that level. 
		mocha.describe('correct call', function () {
			// Used by the test and in after so needs to be at this scope.
			let readingsStub;

			mocha.after('restore sinon stub', function () {
				// If the original function isn't restored, It can break other tests in OED.
				// Use after() so restores even if test fails.
				readingsStub.restore();
			});

			mocha.it('returns threeD readings correctly when called correctly', async () => {
				// The moments in these tests all involve TimeInterval that converts to UTC
				// and not the DB so okay to use local timezone.
				const timeString = '2017-01-01T00:00:00.000Z_2017-01-02T00:00:00.000Z';
                const timeInterval = TimeInterval.fromString(timeString);

				// getMeterThreeDReadings is called by meterThreeDReadings. This makes it appear the result is what is given here.
				readingsStub = sinon.stub(Reading, 'getThreeDReadings');
				readingsStub.resolves({
					1: [
						{ reading: 1, start_timestamp: timeInterval.startTimestamp, end_timestamp: timeInterval.endTimestamp }
					]
				});

				const three_d_test_query = {
					timeInterval: timeString,
					graphicUnitId: '99',
					readingInterval: '1'
				};

				const res = await chai.request(app)
					.get(`${THREE_D_METERS_ENDPOINT}/1`)
					.query(three_d_test_query);

				expect(res).to.have.status(HTTP_CODES.OK);

				const expectedResponse = {
					1: [
						{ reading: 1, start_timestamp: timeInterval.startTimestamp.toISOString() , end_timestamp: timeInterval.endTimestamp.toISOString() }
					]
				};
				expect(res.body).to.deep.equal(expectedResponse);
			});
		});
	});


	mocha.describe('the group 3D readings route', () => {
		const THREE_D_GROUPS_ENDPOINT = '/api/unitReadings/threeD/groups';
		const valid_query = { timeInterval: createTimeString('2022-01-01', '00:00:00', '2023-01-01', '00:00:00'), graphicUnitId: '99', readingInterval: '1' }

		mocha.describe('validation', () => {
			mocha.it('fails to validate when the group_id param is invalid', async () => {
				await validateNumericIdInPath({
					baseEndpoint: THREE_D_GROUPS_ENDPOINT,
					invalidValues: [
						'abc',
						'1,',
						',1',
						'1,2',
						'1,,2',
						'1;2',
						'1.5',
						'-1',
						'1 2',
					],
					query: valid_query,
				});
			});
			mocha.it('validates when the time interval is valid', async () => {
				await expectValidCommaSeparatedIds({
					baseEndpoint: THREE_D_GROUPS_ENDPOINT,
					validValues: ['1', '12'],
					query: valid_query
				});
			});
		});

		// This needs to run the after() for this test so separated into its own describe since after works at that level. 
		mocha.describe('correct call', function () {
			// Used by the test and in after so needs to be at this scope.
			let readingsStub;

			mocha.after('restore sinon stub', function () {
				// If the original function isn't restored, It can break other tests in OED.
				// Use after() so restores even if test fails.
				readingsStub.restore();
			});
			mocha.it('returns group threeD readings correctly when called correctly', async () => {
				// The moments in these tests all involve TimeInterval that converts to UTC
				// and not the DB so okay to use local timezone.
				const timeString = '2017-01-01T00:00:00.000Z_2017-01-02T00:00:00.000Z';
				const timeInterval = TimeInterval.fromString(timeString);

				// getGroupThreeDReadings is called by groupThreeDReadings. This makes it appear the result is what is given here.
				readingsStub = sinon.stub(Reading, 'getGroupThreeDReadings');
				readingsStub.resolves({
					1: [
						{ reading: 1, start_timestamp: timeInterval.startTimestamp, end_timestamp: timeInterval.endTimestamp }
					]
				});

				const three_d_test_query = {
					timeInterval: timeString,
					graphicUnitId: '99',
					readingInterval: '1'
				};

				const res = await chai.request(app)
					.get(`${THREE_D_GROUPS_ENDPOINT}/1`)
					.query(three_d_test_query);

				expect(res).to.have.status(HTTP_CODES.OK);

				const expectedResponse = {
					1: [
						{ reading: 1, start_timestamp: timeInterval.startTimestamp.toISOString(), end_timestamp: timeInterval.endTimestamp.toISOString() }
					]
				};
				expect(res.body).to.deep.equal(expectedResponse);
			});
		});
	});
});
