/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the API for retrieving meters, by artificially
 * inserting meters prior to executing the test code. */

const { chai, mocha, expect, app, testDB, testUser } = require('../common');
const Meter = require('../../models/Meter');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const Point = require('../../models/Point');
const moment = require('moment-timezone');
const gps = new Point(90, 45);
const Unit = require('../../models/Unit');

// TODO These tests are not as good as they should be now that information on
// meters is returned to all users. They should be updated.

/**
 * Verifies the values in the meter are the ones expected.
 * @param {*} meters If # meters > 1 then array of meters, else single meter
 * @param {*} length # meters to check and in meters
 * @param {*} isAdmin true if user is admin and sees all meter details.
 * @param {*} unit The unit id to check
 */
function expectMetersToBeEquivalent(meters, length, isAdmin, unit) {
	for (let i = 0; i < length; i++) {
		// If length is 1 then it is not an array.
		let meter;
		if (length === 1) {
			meter = meters;
		} else {
			meter = meters[i];
		}
		// Everyone can see this info on all meters
		expect(meter).to.have.property('id');
		expect(meter).to.have.property('enabled', true);
		expect(meter).to.have.property('gps');
		expect(meter.gps).to.have.property('latitude', gps.latitude);
		expect(meter.gps).to.have.property('longitude', gps.longitude);
		// The first 3 are visible but the 4th is not visible where its name is special.
		if (i < 3) {
			expect(meter).to.have.property('displayable', true);
		} else {
			// This is the extra meter visible to admins.
			expect(meter).to.have.property('displayable', false);
		}
		expect(meter).to.have.property('identifier', (isAdmin === true || meter.displayable === true) ? 'Identified ' + (i + 1) : null);
		expect(meter).to.have.property('area', (i + 1) * 10.0);
		expect(meter).to.have.property('unitId', unit);
		expect(meter).to.have.property('defaultGraphicUnit', unit);
		if (isAdmin) {
			// Admin so see more values
			// Last meter name differs since admin only.
			expect(meter).to.have.property('name', i === 3 ? 'Not Visible' : `Meter ${i + 1}`);
			expect(meter).to.have.property('url', '1.1.1.1');
			expect(meter).to.have.property('meterType', Meter.type.MAMAC);
			expect(meter).to.have.property('timeZone', `+0${i + 1}`);
			expect(meter).to.have.property('note', `notes ${i + 1}`);
			expect(meter).to.have.property('cumulative', true);
			expect(meter).to.have.property('cumulativeReset', true);
			expect(meter).to.have.property('cumulativeResetStart', '01:01:25');
			expect(meter).to.have.property('cumulativeResetEnd', '05:05:05');
			expect(meter).to.have.property('readingGap', 5.1);
			expect(meter).to.have.property('readingVariation', 7.3);
			expect(meter).to.have.property('reading', (i + 1) * 1.0);
			expect(meter).to.have.property('readingDuplication', 1);
			expect(meter).to.have.property('timeSort', 'increasing');
			expect(meter).to.have.property('endOnlyTime', false);
			expect(meter).to.have.property('startTimestamp', '0001-01-01 23:59:59');
			expect(meter).to.have.property('endTimestamp', '2020-07-02 01:00:10');
			expect(meter).to.have.property('previousEnd', '2020-03-05T13:15:13.000Z');
		} else {
			expect(meter).to.have.property('name', null);
			expect(meter).to.have.property('url', null);
			expect(meter).to.have.property('meterType', null);
			expect(meter).to.have.property('timeZone', null);
			expect(meter).to.have.property('note', null);
			expect(meter).to.have.property('cumulative', null);
			expect(meter).to.have.property('cumulativeReset', null);
			expect(meter).to.have.property('cumulativeResetStart', null);
			expect(meter).to.have.property('cumulativeResetEnd', null);
			expect(meter).to.have.property('readingGap', null);
			expect(meter).to.have.property('readingVariation', null);
			expect(meter).to.have.property('readingDuplication', null);
			expect(meter).to.have.property('timeSort', null);
			expect(meter).to.have.property('endOnlyTime', null);
			expect(meter).to.have.property('reading', null);
			expect(meter).to.have.property('startTimestamp', null);
			expect(meter).to.have.property('endTimestamp', null);
			expect(meter).to.have.property('previousEnd', null);
		}
	}
}

mocha.describe('meters API', () => {
	let unitId;
	mocha.beforeEach(async () => {
		conn = testDB.getConnection();
		const unit = new Unit(undefined, 'Unit', 'Unit', Unit.unitRepresentType.QUANTITY, 1000, Unit.unitType.UNIT,
			'Unit Suffix', Unit.displayableType.ALL, true, 'Unit Note');
		await unit.insert(conn);
		unitId = unit.id;
	});

	mocha.it('returns nothing with no meters present', async () => {
		const res = await chai.request(app).get('/api/meters');
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expect(res.body).to.have.lengthOf(0);
	});

	mocha.it('returns all meters', async () => {
		const conn = testDB.getConnection();
		await new Meter(undefined, 'Meter 1', '1.1.1.1', true, true, Meter.type.MAMAC, '+01', gps,
			'Identified 1', 'notes 1', 10.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
			1.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 13:15:13', unitId, unitId,
			Unit.areaUnitType.METERS, '13:57:19').insert(conn);
		await new Meter(undefined, 'Meter 2', '1.1.1.1', true, true, Meter.type.MAMAC, '+02', gps,
			'Identified 2', 'notes 2', 20.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
			2.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 13:15:13', unitId, unitId,
			Unit.areaUnitType.METERS, '13:57:19').insert(conn);
		await new Meter(undefined, 'Meter 3', '1.1.1.1', true, true, Meter.type.MAMAC, '+03', gps,
			'Identified 3', 'notes 3', 30.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
			3.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 13:15:13', unitId, unitId,
			Unit.areaUnitType.METERS, '13:57:19').insert(conn);
		await new Meter(undefined, 'Not Visible', '1.1.1.1', true, false, Meter.type.MAMAC, '+04', gps,
			'Identified 4', 'notes 4', 40.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
			4.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 13:15:13', unitId, unitId,
			Unit.areaUnitType.METERS, '13:57:19').insert(conn);

		const res = await chai.request(app).get('/api/meters');
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expect(res.body).to.have.lengthOf(4);
		expectMetersToBeEquivalent(res.body, 4, false, unitId);
	});

	mocha.describe('Admin role & CSV role:', () => {
		for (const role in User.role) {
			if (User.role[role] !== User.role.OBVIUS && User.role[role] !== User.role.EXPORT) {
				let token;
				// Since this .before is in the middle of tests, it should not have issues as
				// documented in usersTest.js.
				mocha.before(async () => {
					let res = await chai.request(app).post('/api/login')
						.send({ username: testUser.username, password: testUser.password });
					token = res.body.token;
				});
				mocha.it('returns all meters', async () => {
					const conn = testDB.getConnection();
					await new Meter(undefined, 'Meter 1', '1.1.1.1', true, true, Meter.type.MAMAC, '+01', gps,
						'Identified 1', 'notes 1', 10.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
						1.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 13:15:13', unitId, unitId,
						Unit.areaUnitType.METERS, '13:57:19').insert(conn);
					await new Meter(undefined, 'Meter 2', '1.1.1.1', true, true, Meter.type.MAMAC, '+02', gps,
						'Identified 2', 'notes 2', 20.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
						2.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 13:15:13', unitId, unitId,
						Unit.areaUnitType.METERS, '13:57:19').insert(conn);
					await new Meter(undefined, 'Meter 3', '1.1.1.1', true, true, Meter.type.MAMAC, '+03', gps,
						'Identified 3', 'notes 3', 30.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
						3.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 13:15:13', unitId, unitId,
						Unit.areaUnitType.METERS, '13:57:19').insert(conn);
					await new Meter(undefined, 'Not Visible', '1.1.1.1', true, false, Meter.type.MAMAC, '+04', gps,
						'Identified 4', 'notes 4', 40.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
						4.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 13:15:13', unitId, unitId,
						Unit.areaUnitType.METERS, '13:57:19').insert(conn);

					const res = await chai.request(app).get('/api/meters').set('token', token);
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.lengthOf(4);
					expectMetersToBeEquivalent(res.body, 4, true, unitId);
				});
			}
		}
	});

	mocha.describe('Export role & Obvius role:', () => {
		for (const role in User.role) {
			if (User.role[role] !== User.role.ADMIN && User.role[role] !== User.role.CSV) {
				let token;
				mocha.beforeEach(async () => {
					// insert test user
					const conn = testDB.getConnection();
					const password = 'password';
					const hashedPassword = await bcrypt.hash(password, 10);
					const unauthorizedUser = new User(undefined, `${role}@example.com`, hashedPassword, User.role[role]);
					await unauthorizedUser.insert(conn);
					unauthorizedUser.password = password;

					// login
					let res = await chai.request(app).post('/api/login')
						.send({ username: unauthorizedUser.username, password: unauthorizedUser.password });
					token = res.body.token;
				});

				mocha.it('should only return visible data', async () => {
					const conn = testDB.getConnection();
					await new Meter(undefined, 'Meter 1', '1.1.1.1', true, true, Meter.type.MAMAC, '+01', gps,
						'Identified 1', 'notes 1', 10.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
						1.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 13:15:13', unitId, unitId,
						Unit.areaUnitType.METERS, '13:57:19').insert(conn);
					await new Meter(undefined, 'Meter 2', '1.1.1.1', true, true, Meter.type.MAMAC, '+02', gps,
						'Identified 2', 'notes 2', 20.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
						2.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 13:15:13', unitId, unitId,
						Unit.areaUnitType.METERS, '13:57:19').insert(conn);
					await new Meter(undefined, 'Meter 3', '1.1.1.1', true, true, Meter.type.MAMAC, '+03', gps,
						'Identified 3', 'notes 3', 30.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
						3.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 13:15:13', unitId, unitId,
						Unit.areaUnitType.METERS, '13:57:19').insert(conn);
					await new Meter(undefined, 'Not Visible', '1.1.1.1', true, false, Meter.type.MAMAC, '+04', gps,
						'Identified 4', 'notes 4', 40.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
						4.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 13:15:13', unitId, unitId,
						Unit.areaUnitType.METERS, '13:57:19').insert(conn);

					const res = await chai.request(app).get('/api/meters').set('token', token);
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.lengthOf(4);
					expectMetersToBeEquivalent(res.body, 4, false, unitId);
				});

				mocha.it(`should reject requests from ${role} to edit meters`, async () => {
					let res = await chai.request(app).post('/api/meters/edit').set('token', token);
					expect(res).to.have.status(403);
				});
			}
		}
	});

	mocha.it('returns details on a single meter by ID', async () => {
		const conn = testDB.getConnection();
		await new Meter(undefined, 'Meter 1', '1.1.1.1', true, true, Meter.type.MAMAC, '+02', gps,
			'Identified 2', 'notes 1', 20.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
			1.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 13:15:13', unitId, unitId,
			Unit.areaUnitType.METERS, '13:57:19').insert(conn);
		// Bit of a hack to set the second meter to Identified 1 so passes test. Same for area and TZ.
		const meter2 = new Meter(undefined, 'Meter 2', '1.1.1.1', true, true, Meter.type.MAMAC, '+01', gps,
			'Identified 1', 'notes 2', 10.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
			2.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 13:15:13', unitId, unitId,
			Unit.areaUnitType.METERS, '13:57:19');
		await meter2.insert(conn);

		const res = await chai.request(app).get(`/api/meters/${meter2.id}`);
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expectMetersToBeEquivalent(res.body, 1, false, unitId);
	});

	mocha.it('responds appropriately when the meter in question does not exist', async () => {
		const conn = testDB.getConnection();
		const meter = new Meter(undefined, 'Meter 1', '1.1.1.1', true, true, Meter.type.MAMAC, '+01', gps,
			'Identified 1', 'notes 1', 10.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
			1.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 13:15:13', unitId, unitId,
			Unit.areaUnitType.METERS, '13:57:19');
		await meter.insert(conn);

		const res = await chai.request(app).get(`/api/meters/${meter.id + 1}`);
		expect(res).to.have.status(500);
	});
});
