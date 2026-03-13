/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app, testUser } = require('../common');

mocha.describe('Weather Location Routes', () => {
	let token;

	mocha.before(async () => {
		const res = await chai.request(app).post('/api/login')
			.send({ username: testUser.username, password: testUser.password });
		token = res.body.token;
	});

	mocha.it('GET all weather locations', async () => {
		const res = await chai.request(app)
			.get('/api/weatherLocation')
			.set('token', token);
		// Check for successful response
		expect(res.status).to.equal(200);
		expect(res.body).to.be.an('array');
	});

	mocha.it('POST for adding a weather location', async () => {
		const newWeatherLocation = {
			identifier: 'Test Location',
			gps: {
				longitude: -121.798942,
				latitude: 36.653562
			},
			note: 'test note'
		};
		// Check for successful response
		const res = await chai.request(app)
			.post('/api/weatherLocation/addWeatherLocation')
			.set('token', token)
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
			.set('token', token)
			.send(locationId);
		expect(res.status).to.equal(200);
	});
	// TODO: test case for deleting a non-existing weather location

	// More tests involving server errors or invalid IDs can go here
});