/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const chai = require('chai');

const expect = chai.expect;
const mocha = require('mocha');
const sinon = require('sinon');

const moment = require('moment');

const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');

const { compressedLineReadings,
	validateLineReadingsParams,
	validateLineReadingsQueryParams,
	compressedMeterBarReadings,
	validateMeterBarReadingsParams,
	validateBarReadingsQueryParams
} = require('../../routes/compressedReadings');

const { TimeInterval } = require('../../../common/TimeInterval');

function mockResponse() {
	return {
		sendStatus: sinon.spy(),
		json: sinon.spy()
	};
}

mocha.describe('Compressed readings routes', () => {
	mocha.describe('the compressed line readings route', () => {

		mocha.describe('validation', () => {
			mocha.it('fails to validate when the meter_ids param is wrong', () => {
				const validationResult = validateLineReadingsParams({ meter_ids: 'not_a_number' });
				expect(validationResult).to.equal(false);
			});
			mocha.it('validates when the meter_ids param is valid', () => {
				const validationResult = validateLineReadingsParams({ meter_ids: '1,2,3' });
				expect(validationResult).to.equal(true);
			});
			mocha.it('validates when the time interval is valid', () => {
				const validationResult = validateLineReadingsQueryParams({timeInterval: TimeInterval.unbounded().toString()});
				expect(validationResult).to.equal(true);
			});
		});

		mocha.it('returns line readings correctly when called correctly', async () => {
			const timeInterval = new TimeInterval(moment('2017-01-01'), moment('2017-01-02'));

			const compressedReadingsStub = sinon.stub(Reading, 'getNewCompressedReadings');
			compressedReadingsStub.resolves({
				1: [
					{reading_rate: 1, start_timestamp: timeInterval.startTimestamp, end_timestamp: timeInterval.endTimestamp}
				]
			});
			const response = await compressedLineReadings([1], timeInterval);

			const expectedResponse = {
				1: [
					{reading: 1, startTimestamp: timeInterval.startTimestamp.valueOf(), endTimestamp: timeInterval.endTimestamp.valueOf()}
				]
			};

			expect(response).to.deep.equal(expectedResponse);
		});
	});
	mocha.describe('the compressed bar readings route', () => {

		mocha.describe('validation', () => {
			mocha.it('fails to validate when the meter_ids param is wrong', () => {
				const validationResult = validateMeterBarReadingsParams({ meter_ids: 'not_a_number' });
				expect(validationResult).to.equal(false);
			});
			mocha.it('validates when the meter_ids param is valid', () => {
				const validationResult = validateMeterBarReadingsParams({ meter_ids: '1,2,3' });
				expect(validationResult).to.equal(true);
			});
			mocha.it('validates when the time interval is valid', () => {
				const validationResult = validateBarReadingsQueryParams(
					{timeInterval: TimeInterval.unbounded().toString(), barWidthDays: '28' }
					);
				expect(validationResult).to.equal(true);
			});
		});

		mocha.it('returns bar readings correctly when called correctly', async () => {
			const timeInterval = new TimeInterval(moment('2017-01-01'), moment('2017-01-02'));

			const compressedReadingsStub = sinon.stub(Reading, 'getNewCompressedBarchartReadings');
			compressedReadingsStub.resolves({
				1: [
					{reading: 1, start_timestamp: timeInterval.startTimestamp, end_timestamp: timeInterval.endTimestamp}
				]
			});
			const response = await compressedMeterBarReadings([1], 1, timeInterval);
			const expectedResponse = {
				1: [
					{reading: 1, startTimestamp: timeInterval.startTimestamp.valueOf(), endTimestamp: timeInterval.endTimestamp.valueOf()}
				]
			};

			expect(response).to.deep.equal(expectedResponse);
		});
	});
});

