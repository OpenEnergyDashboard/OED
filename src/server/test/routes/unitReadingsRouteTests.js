/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const chai = require('chai');

const { mocha, expect, testDB } = require('../common');
const sinon = require('sinon');

const moment = require('moment');

const Reading = require('../../models/Reading');

const { meterLineReadings,
	validateLineReadingsParams,
	validateLineReadingsQueryParams,
	meterBarReadings,
	validateMeterBarReadingsParams,
	validateBarReadingsQueryParams
} = require('../../routes/unitReadings');

const { TimeInterval } = require('../../../common/TimeInterval.js');

function mockResponse() {
	return {
		sendStatus: sinon.spy(),
		json: sinon.spy()
	};
}

mocha.describe('unit readings routes', () => {
	mocha.describe('the line readings route', () => {

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
				const validationResult = validateLineReadingsQueryParams({ timeInterval: TimeInterval.unbounded().toString(), graphicUnitId: '99' });
				expect(validationResult).to.equal(true);
			});

			// TODO Maybe check for invalid for each value in validateLineReadingsQueryParams (also in Bar below).
		});

		mocha.it('returns line readings correctly when called correctly', async () => {
			// The moments in these tests all involve TimeInterval that converts to UTC
			// and not the DB so okay to use local timezone.
			const timeInterval = new TimeInterval(moment('2017-01-01'), moment('2017-01-02'));

			// getMeterLineReadings is called by meterLineReadings. This makes it appear the result is what is given here.
			const readingsStub = sinon.stub(Reading, 'getMeterLineReadings');
			readingsStub.resolves({
				1: [
					{ reading_rate: 1, start_timestamp: timeInterval.startTimestamp, end_timestamp: timeInterval.endTimestamp }
				]
			});
			const response = await meterLineReadings([1], 99, timeInterval);

			const expectedResponse = {
				1: [
					{ reading: 1, startTimestamp: timeInterval.startTimestamp.valueOf(), endTimestamp: timeInterval.endTimestamp.valueOf() }
				]
			};
			expect(response).to.deep.equal(expectedResponse);
			// If the original function isn't restored, It can break other tests in OED
			readingsStub.restore();
		});
	});
	mocha.describe('the bar readings route', () => {

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
					{ timeInterval: TimeInterval.unbounded().toString(), barWidthDays: '28', graphicUnitId: '99' }
				);
				expect(validationResult).to.equal(true);
			});
		});

		mocha.it('returns bar readings correctly when called correctly', async () => {
			const timeInterval = new TimeInterval(moment('2017-01-01'), moment('2017-01-02'));

			// getMeterBarReadings is called by meterBarReadings. This makes it appear the result is what is given here.
			const readingsStub = sinon.stub(Reading, 'getMeterBarReadings');
			readingsStub.resolves({
				1: [
					{ reading: 1, start_timestamp: timeInterval.startTimestamp, end_timestamp: timeInterval.endTimestamp }
				]
			});
			const response = await meterBarReadings([1], 99, 1, timeInterval);
			const expectedResponse = {
				1: [
					{ reading: 1, startTimestamp: timeInterval.startTimestamp.valueOf(), endTimestamp: timeInterval.endTimestamp.valueOf() }
				]
			};

			expect(response).to.deep.equal(expectedResponse);
			// If the original function isn't restored, It can break other tests in OED
			readingsStub.restore();
		});
	});
});

