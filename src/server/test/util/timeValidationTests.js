/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { mocha } = require('../common');
const { isValidIsoDateTime, isValidIsoDuration, isValidTimeInterval } = require('../../util/timeValidation');

mocha.describe('timeValidation utility', () => {

	mocha.describe('isValidIsoDateTime', () => {
		mocha.it('should accept valid ISO 8601 datetimes with UTC timezone', () => {
			const valid = [
				'2023-01-01T00:00:00.000Z',
				'2023-12-31T23:59:59.999Z',
				'2020-06-15T12:30:00Z'
			];
			for (const v of valid) {
				expect(isValidIsoDateTime(v), v).to.equal(true);
			}
		});

		mocha.it('should accept valid ISO 8601 datetimes with offset timezone', () => {
			const valid = [
				'2023-01-01T00:00:00+05:30',
				'2023-06-15T08:00:00-07:00'
			];
			for (const v of valid) {
				expect(isValidIsoDateTime(v), v).to.equal(true);
			}
		});

		mocha.it('should reject date-only strings (no time or timezone)', () => {
			const invalid = ['2023-01-01', '2023-12-31'];
			for (const v of invalid) {
				expect(isValidIsoDateTime(v), v).to.equal(false);
			}
		});

		mocha.it('should reject clearly invalid strings', () => {
			const invalid = [
				'not-a-date',
				'',
				'2023-13-01T00:00:00Z',   // invalid month
				'2023-01-32T00:00:00Z',   // invalid day
				'P1D',                    // duration, not datetime
				"'; DROP TABLE meters; --"
			];
			for (const v of invalid) {
				expect(isValidIsoDateTime(v), v).to.equal(false);
			}
		});
	});

	mocha.describe('isValidIsoDuration', () => {
		mocha.it('should accept valid ISO 8601 durations', () => {
			const valid = [
				'P1D',
				'P1Y2M3DT4H5M6S',
				'PT1H30M',
				'P1Y',
				'PT0.5S'
			];
			for (const v of valid) {
				expect(isValidIsoDuration(v), v).to.equal(true);
			}
		});

		mocha.it('should reject invalid duration strings', () => {
			const invalid = [
				'P',          // empty duration
				'P1X',        // invalid designator
				'PT0S',       // zero duration
				'1D',         // missing leading P
				'not-a-duration',
				'2023-01-01T00:00:00Z',  // datetime, not duration
				''
			];
			for (const v of invalid) {
				expect(isValidIsoDuration(v), v).to.equal(false);
			}
		});
	});

	mocha.describe('isValidTimeInterval', () => {
		mocha.it('should accept "all"', () => {
			expect(isValidTimeInterval('all')).to.equal(true);
		});

		mocha.it('should accept bounded ISO_ISO format', () => {
			const v = '2023-01-01T00:00:00.000Z_2023-12-31T23:59:59.999Z';
			expect(isValidTimeInterval(v)).to.equal(true);
		});

		mocha.it('should accept left-unbounded _ISO format when one-sided intervals are allowed', () => {
			const v = '_2023-12-31T23:59:59.999Z';
			expect(isValidTimeInterval(v, true)).to.equal(true);
		});

		mocha.it('should accept right-unbounded ISO_ format when one-sided intervals are allowed', () => {
			const v = '2023-01-01T00:00:00.000Z_';
			expect(isValidTimeInterval(v, true)).to.equal(true);
		});

		mocha.it('should reject one-sided intervals by default', () => {
			expect(isValidTimeInterval('_2023-12-31T23:59:59.999Z')).to.equal(false);
			expect(isValidTimeInterval('2023-01-01T00:00:00.000Z_')).to.equal(false);
		});

		mocha.it('should reject strings with no underscore', () => {
			expect(isValidTimeInterval('2023-01-01T00:00:00.000Z')).to.equal(false);
			expect(isValidTimeInterval('invalid_format')).to.equal(false);
		});

		mocha.it('should reject strings with invalid ISO timestamps', () => {
			const invalid = [
				'not-a-date_2023-12-31T00:00:00Z',
				'2023-01-01T00:00:00Z_not-a-date',
				'2023-01-01_2023-12-31',            // date-only, no timezone
				'<script>_2023-01-01T00:00:00Z'
			];
			for (const v of invalid) {
				expect(isValidTimeInterval(v), v).to.equal(false);
			}
		});

		mocha.it('should reject empty underscore with no timestamps', () => {
			expect(isValidTimeInterval('_')).to.equal(false);
		});
	});
});
