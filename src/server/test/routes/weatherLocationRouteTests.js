/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app } = require('../common');

mocha.describe('Weather Location Routes', () => {
	mocha.it('GET all weather locations', async () => {
		const res = await chai.request(app)
		// Check for successful response
		expect(res.status).to.equal(200);
		expect(res.body).to.be.an('array');
	});

	mocha.it('POST for adding a weather location', async () => {
		const newWeatherLocation = {
			identifier: 'Test Location',
			longitude: -121.798942,
			latitude: 36.653562,
			note: 'test note'
		};
		// Check for successful response
		const res = await chai.request(app)
			.post('/api/weatherLocation/addWeatherLocation')
			.send(newWeatherLocation);
		expect(res.status).to.equal(200);
	});
	// TODO: more test cases with invalid data

	mocha.it('POST for deleting a weather location', async () => {
		// Assuming there is an existing weather location with ID 1
		const locationId = { id: 1 };
		// Check for successful response
		const res = await chai.request(app)
			.post('/api/weatherLocation/delete')
			.send(locationId);
		expect(res.status).to.equal(200);
	});
	// TODO: test case for deleting a non-existing weather location

	// More tests involving server errors or invalid IDs can go here
});