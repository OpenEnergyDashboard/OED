/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the API for retrieving preferences, by artificially
 * inserting preferences prior to executing the test code. */

const { chai, mocha, expect } = require('../common');
const { app, testUser, testDB } = require('../commonTestDB');
const User = require('../../models/User');
const { HTTP_CODES } = require('../../util/httpCodes');
const { getTokenForUser, getTokenForRole, logoutWithToken } = require('../util/accessHelpers');

mocha.describe('preferences API', () => {
	mocha.describe('modification api', () => {
		mocha.describe('edit endpoint', () => {
			const preferences = {
				displayTitle: 'title',
				defaultChartToRender: 'line',
				defaultBarStacking: true,
				defaultLanguage: 'en',
				defaultWarningFileSize: 5,
				defaultFileSizeLimit: 25,
				defaultAreaNormalization: true,
				defaultAreaUnit: 'meters',
				defaultMeterReadingFrequency: '1:13:17'
			};
			mocha.describe('Admin role: ', () => {
				let token;
				mocha.beforeEach(async () => {
					// login
					token = await getTokenForUser(testUser);
				});
				mocha.afterEach(async () => {
					// logout
					if (token) {
						await logoutWithToken(token);
					}
				});

				mocha.it('should accept requests from Admin role', async () => {
					const res = await chai.request(app).post('/api/preferences')
						.set('token', token)
						.send({ preferences });
					expect(res).to.have.status(HTTP_CODES.OK);
				});
			});

			mocha.describe('Non-Admin roles: ', () => {
				for (const role in User.role) {
					if (User.role[role] !== User.role.ADMIN) {
						let token;
						// The describe block is used to group related tests to a specific role's scope.
						// This is important since the beforeEach/afterEach blocks should login/logout only
						// for the current test's role instead of every role.							
						mocha.describe(`${role} role`, async () => {
							mocha.beforeEach(async () => {
								// login
								const conn = testDB.getConnection();
								token = await getTokenForRole(role, conn);
							});
							mocha.afterEach(async () => {
								// logout
								if (token) {
									await logoutWithToken(token);
								}
							});

							mocha.it(`should reject requests from ${role}`, async () => {
								const res = await chai.request(app).post('/api/preferences')
									.set('token', token)
									.send({ preferences });
								expect(res).to.have.status(HTTP_CODES.FORBIDDEN);
							});
						});
					}
				}
			});
		});
	});
})
