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
			expect(meter).to.have.property('areaUnit', Unit.areaUnitType.METERS);
			expect(meter).to.have.property('readingFrequency', 'PT13H57M19S');
			expect(meter).to.have.property('minVal', Number.MIN_SAFE_INTEGER);
			expect(meter).to.have.property('maxVal', Number.MAX_SAFE_INTEGER);
			expect(meter).to.have.property('minDate', moment(0).utc().format('YYYY-MM-DD HH:mm:ssZ'));
			expect(meter).to.have.property('maxDate', moment(0).utc().add(5000, 'years').format('YYYY-MM-DD HH:mm:ssZ'));
			expect(meter).to.have.property('maxError', 75);
			expect(meter).to.have.property('disableChecks', Unit.disableChecksType.REJECT_ALL);
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
			expect(meter).to.have.property('areaUnit', Unit.areaUnitType.METERS);
			expect(meter).to.have.property('readingFrequency', null);
			expect(meter).to.have.property('minVal', null);
			expect(meter).to.have.property('maxVal', null);
			expect(meter).to.have.property('minDate', null);
			expect(meter).to.have.property('maxDate', null);
			expect(meter).to.have.property('maxError', null);
			expect(meter).to.have.property('disableChecks', null);
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

	mocha.it('certain parameters are correctly null on non-admin access', async () => {
		const conn = testDB.getConnection();
		const password = 'password';
		const hashedPassword = await bcrypt.hash(password, 10);
		const nonAdmin = new User(undefined, `${role}@example.com`, hashedPassword, User.role[role]);
		await nonAdmin.insert(conn);
		nonAdmin.password = password;

		let res = await chai.request(app).post('/api/login')
			.send({ username: unauthorizedUser.username, password: unauthorizedUser.password });
		token = res.body.token;

		const conn = testDB.getConnection();
		await new Meter(undefined, 'Meter 1', '1.1.1.1', true, true, Meter.type.MAMAC, '+02', gps,
			'Identified 2', 'notes 1', 20.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
			1.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 13:15:13', unitId, unitId,
			Unit.areaUnitType.METERS, '13:57:19').insert(conn);
		
		const res = await chai.request(app).get('/api/meters').set('token', token);
		const meter = res.body[0];

		expect(meter.name).to.equal(null);
		expect(meter.url).to.equal(null);
		expect(meter.meterType).to.equal(null);
		expect(meter.timeZone).to.equal(null);
		expect(meter.note).to.equal(null);
		expect(meter.cumulative).to.equal(null);
		expect(meter.cumulativeReset).to.equal(null);
		expect(meter.cumulativeResetStart).to.equal(null);
		expect(meter.cumulativeResetEnd).to.equal(null);
		expect(meter.readingGap).to.equal(null);
		expect(meter.readingVariation).to.equal(null);
		expect(meter.readingDuplication).to.equal(null);
		expect(meter.timeSort).to.equal(null);
		expect(meter.endOnlyTime).to.equal(null);
		expect(meter.reading).to.equal(null);
		expect(meter.startTimestamp).to.equal(null);
		expect(meter.endTimeStamp).to.equal(null);
		expect(meter.previousEnd).to.equal(null);
		expect(meter.readingFrequency).to.equal(null);
		expect(meter.minVal).to.equal(null);
		expect(meter.maxVal).to.equal(null);
		expect(meter.minDate).to.equal(null);
		expect(meter.maxDate).to.equal(null);
		expect(meter.maxError).to.equal(null);
		expect(meter.disableChecks).to.equal(null);
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

mocha.describe('Meter model', () => {
	mocha.it('returns -99 when convertUnitValue is passed with null', async () => {
		const unit = Meter.convertUnitValue(null);
		expect(unit).to.equal(-99);
	});

	mocha.it('returns -99 when unitID & defaultGraphicUnit is -99 and inserted into DB', async () => {
		const conn = testDB.getConnection();
		const meterPreInsert = new Meter(undefined, 'Meter 1', '1.1.1.1', true, true, Meter.type.MAMAC, '+01', gps,
			'Identified 1', 'notes 1', 10.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
			1.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 13:15:13', -99, -99,
			Unit.areaUnitType.METERS, '13:57:19');
		await meterPreInsert.insert(conn);

		const meterPostInsert = await Meter.getByID(meterPreInsert.id, conn);
		expect(meterPostInsert.unitId).to.equal(-99);
		expect(meterPostInsert.defaultGraphicUnit).to.equal(-99);
	});

	mocha.it('returns -99 when unitID & defaultGraphicUnit is updated to -99', async() => {
		let unitId;
		const conn = testDB.getConnection();
		mocha.beforeEach(async () => {
			const unit = new Unit(undefined, 'Unit', 'Unit', Unit.unitRepresentType.QUANTITY, 1000, Unit.unitType.UNIT,
				'Unit Suffix', Unit.displayableType.ALL, true, 'Unit Note');
			await unit.insert(conn);
			unitId = unit.id;
		});

		const meterPreInsert = new Meter(undefined, 'Meter 1', '1.1.1.1', true, true, Meter.type.MAMAC, '+01', gps,
			'Identified 1', 'notes 1', 10.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
			1.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 13:15:13', unitId, unitId,
			Unit.areaUnitType.METERS, '13:57:19');
		await meterPreInsert.insert(conn);

		meterPreInsert.unitId = -99;
		meterPreInsert.defaultGraphicUnit = -99;
		await meterPreInsert.update(conn);

		const meterPostUpdate = await Meter.getByID(meterPreInsert.id, conn);
		expect(meterPostUpdate.unitId).to.equal(-99);
		expect(meterPostUpdate.defaultGraphicUnit).to.equal(-99);
	});
});

mocha.describe('Meters', () => {
	let unitA, unitB;
	mocha.beforeEach(async () => {
		unitA = new Unit(undefined, 'Unit A', 'Unit A Id', Unit.unitRepresentType.QUANTITY, 1000,
			Unit.unitType.UNIT, 'Unit A Suffix', Unit.displayableType.ALL, true, 'Unit A Note');
		unitB = new Unit(undefined, 'Unit B', 'Unit B Id', Unit.unitRepresentType.QUANTITY, 2000,
			Unit.unitType.UNIT, 'Unit B Suffix', Unit.displayableType.ALL, true, 'Unit B Note');
		const unitC = new Unit(undefined, 'Unit C', 'Unit C Id', Unit.unitRepresentType.QUANTITY, 3000,
			Unit.unitType.UNIT, 'Unit C Suffix', Unit.displayableType.ALL, true, 'Unit C Note');
		await Promise.all([unitA, unitB, unitC].map(unit => unit.insert(conn)));
	});

	mocha.it('can be saved and retrieved', async () => {
		const conn = testDB.getConnection();
		const meterPreInsert = new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC, 'UTC',
			gps, 'Identified', 'notes', 33.5, true, true, '05:05:09', '09:00:01', 0, 0, 1, 'increasing', false,
			25.5, '0001-01-01 23:59:59-05:00', '2020-07-02 01:00:10-06:00', '2020-03-05 02:12:00-06:00', unitA.id,
			unitA.id, Unit.areaUnitType.METERS, '12:34:56');
		await meterPreInsert.insert(conn);
		const meterPostInsertByName = await Meter.getByName(meterPreInsert.name, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByName);
		const meterPostInsertByID = await Meter.getByID(meterPreInsert.id, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByID);
	});

	mocha.it('can be saved and retrieved with no graphic units', async () => {
		const conn = testDB.getConnection();
		const meterPreInsert = new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC, 'UTC',
			gps, 'Identified', 'notes', 33.5, true, true, '05:05:09', '09:00:01', 0, 0, 1, 'increasing', false,
			25.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', -99, -99,
			Unit.areaUnitType.FEET, undefined);
		await meterPreInsert.insert(conn);
		const meterPostInsertByName = await Meter.getByName(meterPreInsert.name, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByName);
		const meterPostInsertByID = await Meter.getByID(meterPreInsert.id, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByID);
	});

	mocha.it('can be saved, edited, and retrieved', async () => {
		const conn = testDB.getConnection();
		const meterPreInsert = new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC, 'UTC', gps,
			'Identified', 'notes', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
			1.5, '0001-01-01 23:59:59+00:00', '2020-07-02 01:00:10+00:00', '2020-03-05 02:12:00+00:00', unitA.id, unitA.id,
			Unit.areaUnitType.METERS, '1 day 3 hours 12 minutes');
		await meterPreInsert.insert(conn);
		const meterPostInsertByID = await Meter.getByID(meterPreInsert.id, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByID);

		meterPreInsert.name = 'Something Else';
		meterPreInsert.enabled = true;
		meterPreInsert.meterTimezone = 'GMT';
		meterPreInsert.unitId = 3;
		await meterPreInsert.update(conn);
		const meterPostUpdate = await Meter.getByID(meterPreInsert.id, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostUpdate);
	});

	mocha.it('can get only enabled meters', async () => {
		const conn = testDB.getConnection();
		// Don't set timestamp values to see if defaults work.
		const enabledMeter = new Meter(undefined, 'EnabledMeter', null, true, true, Meter.type.MAMAC, null, gps,
			'Identified', 'notes', 35.0, true, true, '01:01:25', '00:00:00', 7, 11, 1, 'increasing', false,
			1.5, '0001-01-01 23:59:59+00:00', '2020-07-02 01:00:10+00:00', '2020-03-05 02:12:00+00:00', unitA.id, unitA.id,
			Unit.areaUnitType.METERS, undefined);
		const disabledMeter = new Meter(undefined, 'DisabledMeter', null, false, true, Meter.type.MAMAC, null, gps,
			'Identified 1', 'Notes 1', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
			1.5, '0002-01-01 23:59:59+00:00', '2020-07-02 01:00:10+00:00', '2020-03-05 02:12:00+00:00', unitA.id, unitA.id,
			Unit.areaUnitType.METERS, undefined);
		await enabledMeter.insert(conn);
		await disabledMeter.insert(conn);
		// set default timestamps for testing.
		disabledMeter.startTimestamp = '1970-01-01 00:00:00+00:00';
		disabledMeter.endTimestamp = '1970-01-01 00:00:00+00:00';
		disabledMeter.previousEnd = '1970-01-01 00:00:00+00:00';

		const enabledMeters = await Meter.getEnabled(conn);
		expect(enabledMeters).to.have.lengthOf(1);
		expectMetersToBeEquivalent(enabledMeter, enabledMeters[0]);
	});

	mocha.it('can get only visible meters', async () => {
		const conn = testDB.getConnection();
		const visibleMeter = new Meter(undefined, 'VisibleMeter', null, true, true, Meter.type.MAMAC, null, gps,
			'Identified 1', 'notes 1', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
			1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitA.id, unitA.id,
			Unit.areaUnitType.METERS, undefined);
		const invisibleMeter = new Meter(undefined, 'InvisibleMeter', null, true, false, Meter.type.MAMAC, null, gps,
			'Identified 2', 'Notes 2', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
			1.5, '0002-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitA.id, unitA.id,
			Unit.areaUnitType.METERS, undefined);

		await visibleMeter.insert(conn);
		await invisibleMeter.insert(conn);

		const visibleMeters = await Meter.getDisplayable(conn);
		expect(visibleMeters).to.have.lengthOf(1);
		expectMetersToBeEquivalent(visibleMeter, visibleMeters[0]);
	});

	mocha.it('can get all meter where unitId is not null', async () => {
		const meterA = new Meter(undefined, 'MeterA', null, true, true, Meter.type.MAMAC, null, gps,
			'MeterA', 'notes 1', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
			1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitA.id, unitA.id,
			Unit.areaUnitType.METERS, undefined);
		const meterB = new Meter(undefined, 'MeterB', null, true, true, Meter.type.MAMAC, null, gps,
			'MeterB', 'notes 2', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
			1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitB.id, unitB.id,
			Unit.areaUnitType.METERS, undefined);
		const meterC = new Meter(undefined, 'Meter C', null, true, true, Meter.type.MAMAC, null);
		const meterD = new Meter(undefined, 'MeterD', null, true, true, Meter.type.MAMAC, null, gps,
			'MeterD', 'notes 2', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
			1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', -99, -99,
			Unit.areaUnitType.METERS, undefined);

		await Promise.all([meterA, meterB, meterC, meterD].map(meter => meter.insert(conn)));
		const expectedMeters = [meterA, meterB];
		const actualMeters = await Meter.getUnitNotNull(conn);
		actualMeters.sort((a, b) => a.id - b.id);
		expectedMeters.sort((a, b) => a.id - b.id);

		expect(expectedMeters.length).to.be.equal(actualMeters.length);
		for (let i = 0; i < expectedMeters.length; ++i) {
			expectMetersToBeEquivalent(expectedMeters[i], actualMeters[i]);
		}
	});

	mocha.it('can get meter by identifier', async () => {
			const conn = testDB.getConnection();
			const meterA = new Meter(undefined, 'MeterA', null, true, true, Meter.type.MAMAC, null, gps, 
				'MeterA', 'notes 1', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
				1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitA.id, unitA.id,
				Unit.areaUnitType.METERS, undefined);
			await meterA.insert(conn);

			const identifierMeter = await Meter.getByIdentifier('MeterA', conn);
			expectMetersToBeEquivalent(meterA, identifierMeter);
	});

	mocha.it('can get all meters', async () => {
			const conn = testDB.getConnection();
			const meterA = new Meter(undefined, 'MeterA', null, true, true, Meter.type.MAMAC, null, gps, 
				'MeterA', 'notes 1', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
				1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitA.id, unitA.id,
				Unit.areaUnitType.METERS, undefined);
			const meterB = new Meter(undefined, 'MeterB', null, true, true, Meter.type.MAMAC, null, gps, 
				'MeterB', 'notes 1', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
				1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitB.id, unitB.id,
				Unit.areaUnitType.METERS, undefined);
			const meterC= new Meter(undefined, 'MeterC', null, true, true, Meter.type.MAMAC, null, gps, 
				'MeterC', 'notes 1', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
				1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitC.id, unitC.id,
				Unit.areaUnitType.METERS, undefined);

			await Promise.all([meterA, meterB, meterC].map(meter => meter.insert(conn)));
			const allActualMeters = await Meter.getAll(conn);
			const allExpectedMeters = [meterA, meterB, meterC];
			allActualMeters.sort((a,b) => a.id - b.id);
			allExpectedMeters.sort((a,b) => a.id - b.id);

			expect(allActualMeters.length).to.be.equal(allExpectedMeters.length);
			for (let i = 0; i < allActualMeters.length; ++i) {
				expectMetersToBeEquivalent(allActualMeters[i], allExpectedMeters[i]);
			}
	});

	mocha.it('can check a meter with same name', async () => {
		const conn = testDB.getConnection();
		const meterA = new Meter(undefined, 'MeterOne', null, true, true, Meter.type.MAMAC, null, gps, 
			'MeterA', 'notes 1', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
			1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitA.id, unitA.id,
			Unit.areaUnitType.METERS, undefined);
		const meterB = new Meter(undefined, 'MeterOne', null, true, true, Meter.type.MAMAC, null, gps, 
			'MeterB', 'notes 1', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
			1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitA.id, unitA.id,
			Unit.areaUnitType.METERS, undefined);
		const meterC = new Meter(undefined, 'MeterTwo', null, true, true, Meter.type.MAMAC, null, gps, 
			'MeterC', 'notes 1', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
			1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitA.id, unitA.id,
			Unit.areaUnitType.METERS, undefined);
		await Promise.all([meterA, meterB, meterC].map(meter => meter.insert(conn)));

		expect(meterA.existsByName(conn)).to.be.equal(true);
		expect(meterB.existsByName(conn)).to.be.equal(true);
		expect(meterC.existsByName(conn)).to.be.equal(false);
	});

	mocha.it('can make meter data valid', async () => {
		const meter = new Meter(undefined, 'MeterOne', null, true, true, Meter.type.MAMAC, null, gps, 
			'MeterA', 'notes 1', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
			1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', -99, unitA.id,
			Unit.areaUnitType.METERS, undefined);
		Meter.makeMeterDataValid(meter);

		expect(meter.defaultGraphicUnit).to.be.equal(-99);
		expect(meter.displayable).to.be.equal(false);
	});
});

module.exports = {
	expectMetersToBeEquivalent
};
