/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { mocha } = require('../common');
const request = require('supertest');
const app = require('../../app');
const { expect } = require('chai');

mocha.describe('Weather Location Routes', () => {
    mocha.describe('GET all weather locations', () => {
        mocha.it('correct call', async () => {
			const response = await request(app).get('/api/weatherLocation');
			// Check for successful response
			expect(response.status).to.equal(200);
			expect(response.body).to.be.an('array');
        });
    });

	mocha.describe('POST for adding a weather location', () => {
		mocha.it('correct call', async () => {
			const newWeatherLocation = {
				identifier: 'Test Location',
				longitude: -121.798942,
				latitude: 36.653562,
				note: 'test note'
			};
			// Check for successful response
			const response = await request(app)
			    .post('/api/weatherLocation/addWeatherLocation')
			    .send(newWeatherLocation);
			expect(response.status).to.equal(200);
		});
		// TODO: more test cases with invalid data
	});

	mocha.describe('POST for deleting a weather location', () => {
		mocha.it('correct call', async () => {
			// Assuming there is an existing weather location with ID 1
			const locationId = { id: 1 };
			// Check for successful response
			const response = await request(app)
				.post('/api/weatherLocation/delete')
				.send(locationId);
			expect(response.status).to.equal(200);
		});
		// TODO: test case for deleting a non-existing weather location
	});
	// More tests involving server errors or invalid IDs can go here
});