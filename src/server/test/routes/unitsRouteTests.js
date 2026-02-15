/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { mocha, expect, testDB, app, testUser } = require('../common');
const chai = require('chai');
const Unit = require('../../models/Unit');

mocha.describe('Units Route', () => {
	let token;

	mocha.before(async () => {
		const res = await chai.request(app).post('/api/login')
			.send({ username: testUser.username, password: testUser.password });
		token = res.body.token;
	});

	mocha.describe('Edit endpoint', () => {

		mocha.it('returns 200 and updates the database for valid request', async () => {
			const conn = testDB.getConnection();
			const unit = new Unit(undefined, 'Unit', 'Unit Id', Unit.unitRepresentType.QUANTITY,
				1000, Unit.unitType.UNIT, 'Suffix', Unit.displayableType.ALL, true, 'Note');
			await unit.insert(conn);
			const beforeNote = unit.note;
			const res = await chai.request(app).post('/api/units/edit').set('token', token).send({
				id: unit.id,
				name: 'New name',
				identifier: unit.identifier,
			});
			expect(res).to.have.status(200);
			const updatedUnit = await Unit.getById(unit.id, conn);
			expect(updatedUnit.name).to.equal('New name');
			expect(updatedUnit.note).to.equal(beforeNote);
		});

	});

});
