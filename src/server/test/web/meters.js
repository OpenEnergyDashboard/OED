/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the API for retrieving meters, by artificially
 * inserting meters prior to executing the test code. */

const { chai, mocha, expect, app } = require('./common');
const Meter = require('../../models/Meter');

mocha.describe('meters API', () => {
	mocha.it('returns nothing with no meters present', async () => {
		const res = await chai.request(app).get('/api/meters');
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expect(res.body).to.have.lengthOf(0);
	});

	mocha.it('returns all existing meters', async () => {
		await new Meter(undefined, 'Meter 1', '1.1.1.1', true, Meter.type.MAMAC).insert();
		await new Meter(undefined, 'Meter 2', '1.1.1.1', true, Meter.type.MAMAC).insert();
		await new Meter(undefined, 'Meter 3', '1.1.1.1', true, Meter.type.MAMAC).insert();

		const res = await chai.request(app).get('/api/meters');
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expect(res.body).to.have.lengthOf(3);

		for (let i = 0; i++; i < 3) {
			const meter = res.body[i];
			expect(meter).to.have.property('id');
			expect(meter).to.have.property('name', `Meter ${i + 1}`);
			expect(meter).not.to.have.property('ipAddress');
			expect(meter).not.to.have.property('enabled');
			expect(meter).not.to.have.property('type');
		}
	});

	mocha.it('returns details on a single meter by ID', async () => {
		await new Meter(undefined, 'Meter 1', '1.1.1.1', true, Meter.type.MAMAC).insert();
		const meter2 = new Meter(undefined, 'Meter 2', '1.1.1.1', true, Meter.type.MAMAC);
		await meter2.insert();

		const res = await chai.request(app).get(`/api/meters/${meter2.id}`);
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expect(res.body).to.have.property('id', meter2.id);
		expect(res.body).to.have.property('name', 'Meter 2');
	});

	mocha.it('responds appropriately when the meter in question does not exist', async () => {
		const meter = new Meter(undefined, 'Meter', '1.1.1.1', true, Meter.type.MAMAC);
		await meter.insert();

		const res = await chai.request(app).get(`/api/meters/${meter.id + 1}`);
		expect(res).to.have.status(500);
	});
});
