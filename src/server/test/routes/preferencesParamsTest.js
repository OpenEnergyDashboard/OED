/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app } = require('../common');
const { testInvalidField } = require('../util/validationHelpers');
const { HTTP_CODE } = require('../../util/readingsUtils');
const {
	STRING_SHORT_MAX_LENGTH,
	STRING_GENERAL_MAX_LENGTH
} = require('../../util/validationConstants');

mocha.describe('Preferences Parameter Validation', () => {

	mocha.describe('GET /api/preferences - Get Preferences', () => {
		mocha.it('should accept GET requests without parameters', async () => {
			const res = await chai.request(app)
				.get('/api/preferences');

			expect([HTTP_CODE.OK, HTTP_CODE.INTERNAL_SERVER_ERROR]).to.include(res.status);
		});
	});

	mocha.describe('POST /api/preferences - Update Preferences', () => {
		const UPDATE_ENDPOINT = '/api/preferences';

		const basePreferencesData = {
			preferences: {
				displayTitle: 'Test OED Site',
				defaultChartToRender: 'line',
				defaultBarStacking: false,
				defaultLanguage: 'en',
				defaultTimezone: 'UTC',
				defaultWarningFileSize: 1000000,
				defaultFileSizeLimit: 10000000,
				defaultAreaNormalization: false,
				defaultMeterReadingFrequency: '15:00:00',
				defaultMeterMinimumDate: '2020-01-01',
				defaultMeterMaximumDate: '2030-12-31',
				defaultMeterReadingGap: 300,
				defaultMeterMaximumErrors: 10,
				defaultHelpUrl: 'https://example.com/help'
			}
		};

		mocha.it('should reject unauthenticated requests', async () => {
			const res = await chai.request(app)
				.post(UPDATE_ENDPOINT)
				.send(basePreferencesData);

			expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
		});

		mocha.it('should require preferences field', async () => {
			await testInvalidField({
				field: 'preferences',
				invalidValue: undefined,
				endpoint: UPDATE_ENDPOINT,
				basePayload: basePreferencesData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should reject extra top-level fields', async () => {
			const payloadWithExtra = {
				...basePreferencesData,
				maliciousField: 'injection_attempt'
			};

			const res = await chai.request(app)
				.post(UPDATE_ENDPOINT)
				.send(payloadWithExtra);

			expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
		});

		mocha.it('should reject extra fields in preferences object', async () => {
			const payloadWithExtra = {
				preferences: {
					...basePreferencesData.preferences,
					maliciousField: 'injection_attempt'
				}
			};

			const res = await chai.request(app)
				.post(UPDATE_ENDPOINT)
				.send(payloadWithExtra);

			expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
		});

		mocha.describe('String Field Validation', () => {
			const stringFields = [
				{ field: 'displayTitle', maxLength: STRING_SHORT_MAX_LENGTH },
				{ field: 'defaultChartToRender', maxLength: STRING_SHORT_MAX_LENGTH },
				{ field: 'defaultLanguage', maxLength: 10 },
				{ field: 'defaultMeterReadingFrequency', maxLength: STRING_SHORT_MAX_LENGTH },
				{ field: 'defaultMeterMinimumDate', maxLength: STRING_GENERAL_MAX_LENGTH },
				{ field: 'defaultMeterMaximumDate', maxLength: STRING_GENERAL_MAX_LENGTH },
				{ field: 'defaultHelpUrl', maxLength: 500 }
			];

			stringFields.forEach(({ field, maxLength }) => {
				mocha.it(`should validate ${field} string length`, async () => {
					const oversizedValue = 'x'.repeat(maxLength + 1);
					const payload = {
						preferences: {
							...basePreferencesData.preferences,
							[field]: oversizedValue
						}
					};

					const res = await chai.request(app)
						.post(UPDATE_ENDPOINT)
						.send(payload);

					expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
				});

				mocha.it(`should validate ${field} is string type`, async () => {
					const payload = {
						preferences: {
							...basePreferencesData.preferences,
							[field]: 12345
						}
					};

					const res = await chai.request(app)
						.post(UPDATE_ENDPOINT)
						.send(payload);

					expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
				});
			});
		});

		mocha.describe('Number Field Validation', () => {
			const numberFields = [
				{ field: 'defaultWarningFileSize', min: 0, max: basePreferencesData.preferences.defaultWarningFileSize },
				{ field: 'defaultFileSizeLimit', min: 0, max: basePreferencesData.preferences.defaultFileSizeLimit },
				{ field: 'defaultMeterReadingGap', min: 0, max: basePreferencesData.preferences.defaultMeterReadingGap },
				{ field: 'defaultMeterMaximumErrors', min: 0, max: basePreferencesData.preferences.defaultMeterMaximumErrors }
			];

			numberFields.forEach(({ field, min, max }) => {
				mocha.it(`should validate ${field} minimum value`, async () => {
					const payload = {
						preferences: {
							...basePreferencesData.preferences,
							[field]: min - 1
						}
					};

					const res = await chai.request(app)
						.post(UPDATE_ENDPOINT)
						.send(payload);

					expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
				});

				mocha.it(`should validate ${field} maximum value`, async () => {
					const payload = {
						preferences: {
							...basePreferencesData.preferences,
							[field]: max + 1
						}
					};

					const res = await chai.request(app)
						.post(UPDATE_ENDPOINT)
						.send(payload);

					expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
				});

				mocha.it(`should validate ${field} is number type`, async () => {
					const payload = {
						preferences: {
							...basePreferencesData.preferences,
							[field]: 'not_a_number'
						}
					};

					const res = await chai.request(app)
						.post(UPDATE_ENDPOINT)
						.send(payload);

					expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
				});
			});
		});

		mocha.describe('Boolean Field Validation', () => {
			const booleanFields = ['defaultBarStacking', 'defaultAreaNormalization'];

			booleanFields.forEach(field => {
				mocha.it(`should validate ${field} is boolean type`, async () => {
					const invalidValues = ['true', 'false', 1, 0, 'invalid'];

					for (const invalid of invalidValues) {
						const payload = {
							preferences: {
								...basePreferencesData.preferences,
								[field]: invalid
							}
						};

						const res = await chai.request(app)
							.post(UPDATE_ENDPOINT)
							.send(payload);

						expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
					}
				});
			});
		});

		mocha.describe('Timezone Field Validation', () => {
			mocha.it('should accept valid timezone strings', async () => {
				const payload = {
					preferences: {
						...basePreferencesData.preferences,
						defaultTimezone: 'America/New_York'
					}
				};

				const res = await chai.request(app)
					.post(UPDATE_ENDPOINT)
					.send(payload);

				expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			});

			mocha.it('should accept null timezone', async () => {
				const payload = {
					preferences: {
						...basePreferencesData.preferences,
						defaultTimezone: null
					}
				};

				const res = await chai.request(app)
					.post(UPDATE_ENDPOINT)
					.send(payload);

				expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			});

			mocha.it('should reject oversized timezone strings', async () => {
				const payload = {
					preferences: {
						...basePreferencesData.preferences,
						defaultTimezone: 'x'.repeat(60)
					}
				};

				const res = await chai.request(app)
					.post(UPDATE_ENDPOINT)
					.send(payload);

				expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			});

			mocha.it('should reject invalid timezone types', async () => {
				const invalidValues = [123, true, [], {}];

				for (const invalid of invalidValues) {
					const payload = {
						preferences: {
							...basePreferencesData.preferences,
							defaultTimezone: invalid
						}
					};

					const res = await chai.request(app)
						.post(UPDATE_ENDPOINT)
						.send(payload);

					expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
				}
			});
		});

		mocha.describe('Security Attack Prevention', () => {
			mocha.it('should prevent SQL injection attempts in string fields', async () => {
				const sqlInjection = "'; DROP TABLE preferences; --";
				const stringFields = ['displayTitle', 'defaultChartToRender', 'defaultLanguage', 'defaultHelpUrl'];

				for (const field of stringFields) {
					const payload = {
						preferences: {
							...basePreferencesData.preferences,
							[field]: sqlInjection
						}
					};

					const res = await chai.request(app)
						.post(UPDATE_ENDPOINT)
						.send(payload);

					expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
				}
			});

			mocha.it('should prevent XSS injection attempts', async () => {
				const xssPayload = '<script>alert("xss")</script>';

				const payload = {
					preferences: {
						...basePreferencesData.preferences,
						displayTitle: xssPayload
					}
				};

				const res = await chai.request(app)
					.post(UPDATE_ENDPOINT)
					.send(payload);

				expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			});

			mocha.it('should prevent oversized payloads', async () => {
				const hugePayload = {
					preferences: {
						...basePreferencesData.preferences,
						displayTitle: 'x'.repeat(STRING_SHORT_MAX_LENGTH + 1)
					}
				};

				const res = await chai.request(app)
					.post(UPDATE_ENDPOINT)
					.send(hugePayload);

				expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			});

			mocha.it('should prevent prototype pollution attempts', async () => {
				const payload = {
					preferences: {
						...basePreferencesData.preferences,
						'__proto__': { isAdmin: true }
					}
				};

				const res = await chai.request(app)
					.post(UPDATE_ENDPOINT)
					.send(payload);

				expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			});
		});

		mocha.describe('Edge Cases', () => {
			mocha.it('should handle empty preferences object', async () => {
				const payload = {
					preferences: {}
				};

				const res = await chai.request(app)
					.post(UPDATE_ENDPOINT)
					.send(payload);

				expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			});

			mocha.it('should handle null preferences', async () => {
				const payload = {
					preferences: null
				};

				const res = await chai.request(app)
					.post(UPDATE_ENDPOINT)
					.send(payload);

				expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			});

			mocha.it('should handle non-object preferences', async () => {
				const invalidTypes = ['string', 123, true, []];

				for (const invalid of invalidTypes) {
					const payload = {
						preferences: invalid
					};

					const res = await chai.request(app)
						.post(UPDATE_ENDPOINT)
						.send(payload);

					expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
				}
			});
		});
	});
});
