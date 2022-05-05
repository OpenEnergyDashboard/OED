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
const gps = new Point(90, 45);
const moment = require('moment');
const Unit = require('../../models/Unit');

/**
 * Verifies the values in the meter are the ones expected.
 * @param {*} meters If # meters > 1 then array of meters, else single meter
 * @param {*} length # meters to check and in meters
 * @param {*} offset How much to add to values expected to relate to meter index
 * @param {*} unit The unit id to check
 */
function expectMetersToBeEquivalent(meters, length, offset, unit) {
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
		expect(meter).to.have.property('gps');
		expect(meter.gps).to.have.property('latitude', gps.latitude);
		expect(meter.gps).to.have.property('longitude', gps.longitude);
		expect(meter).to.have.property('enabled', true);
		// Copied from /src/server/routes/meters.js
		// TODO: remove this line when usages of meter.name are replaced with meter.identifer
		// Without this, things will break for non-logged in users because we currently rely on
		// the internal name being available. As noted in #605, the intent is to not send the
		// name to a user if they are not logged in.
		expect(meter).to.have.property('identifier', 'Identified ' + (i + offset));
		expect(meter).to.have.property('area', (i + offset) * 10.0);
		expect(meter).to.have.property('unitId', unit);
		expect(meter).to.have.property('defaultGraphicUnit', unit);
		// A couple of properties differ if displayable or not.
		// The first 3 are visible but the 4th is not visible where its name is special.
		if (i < 3) {
			expect(meter).to.have.property('name', `Meter ${i + offset}`);
			expect(meter).to.have.property('displayable', true);
		} else {
			// This is the extra meter visible to admins.
			expect(meter).to.have.property('name', 'Not Visible');
			expect(meter).to.have.property('displayable', false);
		}
		if (length === 4) {
			// This is the test where you are an admin and should see all attributes of the meter.
			expect(meter).to.have.property('ipAddress', '1.1.1.1');
			expect(meter).to.have.property('meterType', Meter.type.MAMAC);
			expect(meter).to.have.property('timeZone', 'TZ' + (i + offset));
			expect(meter).to.have.property('note', `notes ${i + offset}`);
			expect(meter).to.have.property('cumulative', true);
			expect(meter).to.have.property('cumulativeReset', true);
			expect(meter).to.have.property('cumulativeResetStart', '01:01:25');
			expect(meter).to.have.property('cumulativeResetEnd', '05:05:05');
			expect(meter).to.have.property('readingGap', 5.1);
			expect(meter).to.have.property('readingVariation', 7.3);
			expect(meter).to.have.property('reading', (i + offset) * 1.0);
			expect(meter).to.have.property('readingDuplication', 1);
			expect(meter).to.have.property('timeSort', 'increasing');
			expect(meter).to.have.property('endOnlyTime', false);
			expect(meter).to.have.property('startTimestamp', '0001-01-01T23:59:59.000Z');
			expect(meter).to.have.property('endTimestamp', '2020-07-02T01:00:10.000Z');
		} else {
			// If not an admin then many attributes are not visible and set to null.
			expect(meter).to.have.property('ipAddress', null);
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
		}
	}
}

mocha.describe('meters API', () => {
	mocha.beforeEach(async () => {
		conn = testDB.getConnection();
		await new Unit(undefined, 'Unit', 'Unit', Unit.unitRepresentType.UNUSED, 1000, Unit.unitType.UNIT, 
						1, 'Unit Suffix', Unit.displayableType.ALL, true, 'Unit Note').insert(conn);
	});

	mocha.it('returns nothing with no meters present', async () => {
		const res = await chai.request(app).get('/api/meters');
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expect(res.body).to.have.lengthOf(0);
	});

	mocha.it('returns all visible meters', async () => {
		const conn = testDB.getConnection();
		const unitId = (await Unit.getByName('Unit', conn)).id;
		await new Meter(undefined, 'Meter 1', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ1', gps,
			'Identified 1', 'notes 1', 10.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
			1.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', unitId, unitId).insert(conn);
		await new Meter(undefined, 'Meter 2', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ2', gps,
			'Identified 2', 'notes 2', 20.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
			2.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', unitId, unitId).insert(conn);
		await new Meter(undefined, 'Meter 3', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ3', gps,
			'Identified 3', 'notes 3', 30.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
			3.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', unitId, unitId).insert(conn);
		await new Meter(undefined, 'Not Visible', '1.1.1.1', true, false, Meter.type.MAMAC, 'TZ4', gps,
			'Identified 4', 'notes 4', 40.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
			4.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', unitId, unitId).insert(conn);

		const res = await chai.request(app).get('/api/meters');
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expect(res.body).to.have.lengthOf(3);
		expectMetersToBeEquivalent(res.body, 3, 1, unitId);
	});
	mocha.describe('Admin role:', () => {
		let token;
		mocha.before(async () => {
			let res = await chai.request(app).post('/api/login')
				.send({ email: testUser.email, password: testUser.password });
			token = res.body.token;
		});
		mocha.it('returns all meters', async () => {
			const conn = testDB.getConnection();
			const unitId = (await Unit.getByName('Unit', conn)).id;
			await new Meter(undefined, 'Meter 1', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ1', gps,
				'Identified 1', 'notes 1', 10.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
				1.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', unitId, unitId).insert(conn);
			await new Meter(undefined, 'Meter 2', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ2', gps,
				'Identified 2', 'notes 2', 20.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
				2.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', unitId, unitId).insert(conn);
			await new Meter(undefined, 'Meter 3', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ3', gps,
				'Identified 3', 'notes 3', 30.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
				3.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', unitId, unitId).insert(conn);
			await new Meter(undefined, 'Not Visible', '1.1.1.1', true, false, Meter.type.MAMAC, 'TZ4', gps,
				'Identified 4', 'notes 4', 40.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
				4.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', unitId, unitId).insert(conn);

			const res = await chai.request(app).get('/api/meters').set('token', token);
			expect(res).to.have.status(200);
			expect(res).to.be.json;
			expect(res.body).to.have.lengthOf(4);
			expectMetersToBeEquivalent(res.body, 4, 1, unitId);
		});
	});

	mocha.describe('Non-Admin role:', () => {
		for (const role in User.role) {
			if (User.role[role] !== User.role.ADMIN) {
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
						.send({ email: unauthorizedUser.email, password: unauthorizedUser.password });
					token = res.body.token;
				});

				mocha.it('should only return visible meters and visible data', async () => {
					const conn = testDB.getConnection();
					const unitId = (await Unit.getByName('Unit', conn)).id;
					await new Meter(undefined, 'Meter 1', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ1', gps,
						'Identified 1', 'notes 1', 10.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
						1.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', unitId, unitId).insert(conn);
					await new Meter(undefined, 'Meter 2', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ2', gps,
						'Identified 2', 'notes 2', 20.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
						2.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', unitId, unitId).insert(conn);
					await new Meter(undefined, 'Meter 3', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ3', gps,
						'Identified 3', 'notes 3', 30.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
						3.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', unitId, unitId).insert(conn);
					await new Meter(undefined, 'Not Visible', '1.1.1.1', true, false, Meter.type.MAMAC, 'TZ4', gps,
						'Identified 4', 'notes 4', 40.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
						4.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', unitId, unitId).insert(conn);

					const res = await chai.request(app).get('/api/meters').set('token', token);
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.lengthOf(3);
					expectMetersToBeEquivalent(res.body, 3, 1, unitId);
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
		const unitId = (await Unit.getByName('Unit', conn)).id;
		await new Meter(undefined, 'Meter 1', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ1', gps,
			'Identified 1', 'notes 1', 10.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
			1.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', unitId, unitId).insert(conn);
		const meter2 = new Meter(undefined, 'Meter 2', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ2', gps,
			'Identified 2', 'notes 2', 20.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
			2.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', unitId, unitId);
		await meter2.insert(conn);

		const res = await chai.request(app).get(`/api/meters/${meter2.id}`);
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expectMetersToBeEquivalent(res.body, 1, 2, unitId);
	});

	mocha.it('responds appropriately when the meter in question does not exist', async () => {
		const conn = testDB.getConnection();
		const unitId = (await Unit.getByName('Unit', conn)).id;
		const meter =  new Meter(undefined, 'Meter 1', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ1', gps,
			'Identified 1', 'notes 1', 10.0, true, true, '01:01:25', '05:05:05', 5.1, 7.3, 1, 'increasing', false,
			1.0, '0001-01-01 23:59:59', '2020-07-02 01:00:10', unitId, unitId);
		await meter.insert(conn);

		const res = await chai.request(app).get(`/api/meters/${meter.id + 1}`);
		expect(res).to.have.status(500);
	});
});
