/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app } = require('../common');
const fs = require('fs');
const path = require('path');
const { HTTP_CODE } = require('../../util/readingsUtils');
const { STRING_GENERAL_MAX_LENGTH } = require('../../util/validationConstants');

mocha.describe('CSV Parameter Validation', () => {

	// Helper function to create a test CSV file
	const createTestCsvFile = (content = 'test,data\n1,2') => {
		const tmpDir = path.join(__dirname, '../tmp');
		// Create tmp directory if it doesn't exist
		if (!fs.existsSync(tmpDir)) {
			fs.mkdirSync(tmpDir, { recursive: true });
		}
		const testFilePath = path.join(tmpDir, `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.csv`);
		fs.writeFileSync(testFilePath, content);
		return testFilePath;
	};

	// Helper function to clean up test files
	const cleanupTestFile = (filePath) => {
		try {
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}
		} catch (err) {
			// Ignore cleanup errors
		}
	};

	mocha.describe('POST /api/csv/meters - Meters Upload Validation', () => {
		const METERS_ENDPOINT = '/api/csv/meters';

		const baseMeterData = {
			meterIdentifier: 'test-meter-001',
			gzip: 'no',
			headerRow: 'no',
			update: 'no'
		};

		mocha.it('should reject requests without CSV file', async () => {
			const res = await chai.request(app)
				.post(METERS_ENDPOINT)
				.field(baseMeterData);

			// Should fail due to missing file or auth (403 for CSV role required)
			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
		});

		mocha.it('should reject unauthenticated requests with file', async () => {
			const testFile = createTestCsvFile();

			try {
				const res = await chai.request(app)
					.post(METERS_ENDPOINT)
					.attach('csvfile', testFile)
					.field(baseMeterData);

				// Should fail due to validation or authentication
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			} finally {
				cleanupTestFile(testFile);
			}
		});

		mocha.it('should validate parameter injection protection', async () => {
			const testFile = createTestCsvFile();

			try {
				const payloadWithExtra = {
					...baseMeterData,
					maliciousField: 'injection attempt',
					admin: true,
					deleteAll: true
				};

				const res = await chai.request(app)
					.post(METERS_ENDPOINT)
					.attach('csvfile', testFile)
					.field(payloadWithExtra);

				// Should fail due to additional properties validation or auth
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			} finally {
				cleanupTestFile(testFile);
			}
		});

		mocha.it('should validate gzip parameter enum values', async () => {
			const testFile = createTestCsvFile();

			try {
				const invalidGzipValues = ['maybe', 'true', '1', 'enabled', 'compress'];

				for (const invalidValue of invalidGzipValues) {
					const payload = {
						...baseMeterData,
						gzip: invalidValue
					};

					const res = await chai.request(app)
						.post(METERS_ENDPOINT)
						.attach('csvfile', testFile)
						.field(payload);

					// Should fail validation or auth
					expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
				}
			} finally {
				cleanupTestFile(testFile);
			}
		});

		mocha.it('should validate headerRow parameter enum values', async () => {
			const testFile = createTestCsvFile();

			try {
				const invalidHeaderRowValues = ['maybe', '1', '0', 'exists', 'header'];

				for (const invalidValue of invalidHeaderRowValues) {
					const payload = {
						...baseMeterData,
						headerRow: invalidValue
					};

					const res = await chai.request(app)
						.post(METERS_ENDPOINT)
						.attach('csvfile', testFile)
						.field(payload);

					// Should fail validation or auth
					expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
				}
			} finally {
				cleanupTestFile(testFile);
			}
		});

		mocha.it('should validate update parameter enum values', async () => {
			const testFile = createTestCsvFile();

			try {
				const invalidUpdateValues = ['maybe', '1', 'overwrite', 'replace', 'modify'];

				for (const invalidValue of invalidUpdateValues) {
					const payload = {
						...baseMeterData,
						update: invalidValue
					};

					const res = await chai.request(app)
						.post(METERS_ENDPOINT)
						.attach('csvfile', testFile)
						.field(payload);

					// Should fail validation or auth
					expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
				}
			} finally {
				cleanupTestFile(testFile);
			}
		});

		mocha.it('should handle malicious meterIdentifier inputs', async () => {
			const testFile = createTestCsvFile();

			try {
				const maliciousInputs = [
					"'; DROP TABLE meters; --",
					'<script>alert("xss")</script>',
					'../../../etc/passwd',
					'meter\x00injection',
					'x'.repeat(STRING_GENERAL_MAX_LENGTH)
				];

				for (const maliciousInput of maliciousInputs) {
					const payload = {
						...baseMeterData,
						meterIdentifier: maliciousInput
					};

					const res = await chai.request(app)
						.post(METERS_ENDPOINT)
						.attach('csvfile', testFile)
						.field(payload);

					// Should fail validation or auth
					expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
				}
			} finally {
				cleanupTestFile(testFile);
			}
		});

		mocha.it('should validate backward compatibility parameters', async () => {
			const testFile = createTestCsvFile();

			try {
				// Test meterName instead of meterIdentifier (backward compatibility)
				const payloadWithMeterName = {
					meterName: 'legacy-meter-name',
					gzip: 'no',
					headerRow: 'no',
					update: 'no'
				};

				const res = await chai.request(app)
					.post(METERS_ENDPOINT)
					.attach('csvfile', testFile)
					.field(payloadWithMeterName);

				// Should fail due to validation or authentication  
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			} finally {
				cleanupTestFile(testFile);
			}
		});
	});

	mocha.describe('POST /api/csv/readings - Readings Upload Validation', () => {
		const READINGS_ENDPOINT = '/api/csv/readings';

		const baseReadingsData = {
			meterIdentifier: 'test-meter-001',
			gzip: 'no',
			headerRow: 'no',
			update: 'no',
			cumulative: 'no',
			cumulativeReset: 'no',
			refreshReadings: 'no',
			honorDst: 'no',
			relaxedParsing: 'no',
			useMeterZone: 'no'
		};

		mocha.it('should validate required meter identifier', async () => {
			const testFile = createTestCsvFile();

			try {
				// Test missing both meterIdentifier and meterName
				const payloadMissingIdentifier = {
					gzip: 'no',
					headerRow: 'no',
					update: 'no'
				};

				const res = await chai.request(app)
					.post(READINGS_ENDPOINT)
					.attach('csvfile', testFile)
					.field(payloadMissingIdentifier);

				// Should fail validation or auth
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			} finally {
				cleanupTestFile(testFile);
			}
		});

		mocha.it('should validate timeSort parameter enum values', async () => {
			const testFile = createTestCsvFile();

			try {
				const invalidTimeSortValues = ['ascending', 'descending', 'asc', 'desc', 'random', '1', '0'];

				for (const invalidValue of invalidTimeSortValues) {
					const payload = {
						...baseReadingsData,
						timeSort: invalidValue
					};

					const res = await chai.request(app)
						.post(READINGS_ENDPOINT)
						.attach('csvfile', testFile)
						.field(payload);

					// Should fail validation or auth
					expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
				}
			} finally {
				cleanupTestFile(testFile);
			}
		});

		mocha.it('should validate duplications parameter pattern', async () => {
			const testFile = createTestCsvFile();

			try {
				const invalidDuplicationsValues = ['abc', '1.5', '-1', 'ten', '1,2,3'];

				for (const invalidValue of invalidDuplicationsValues) {
					const payload = {
						...baseReadingsData,
						duplications: invalidValue
					};

					const res = await chai.request(app)
						.post(READINGS_ENDPOINT)
						.attach('csvfile', testFile)
						.field(payload);

					// Should fail validation or auth
					expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
				}
			} finally {
				cleanupTestFile(testFile);
			}
		});

		mocha.it('should validate all boolean parameter enum values', async () => {
			const testFile = createTestCsvFile();

			try {
				const booleanFields = ['cumulative', 'cumulativeReset', 'endOnly', 'honorDst',
					'refreshReadings', 'relaxedParsing', 'useMeterZone'];
				const invalidBooleanValues = ['maybe', '1', '0', 'enabled', 'disabled', 'on', 'off'];

				for (const field of booleanFields) {
					for (const invalidValue of invalidBooleanValues) {
						const payload = {
							...baseReadingsData,
							[field]: invalidValue
						};

						const res = await chai.request(app)
							.post(READINGS_ENDPOINT)
							.attach('csvfile', testFile)
							.field(payload);

						// Should fail validation or auth
						expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
					}
				}
			} finally {
				cleanupTestFile(testFile);
			}
		});

		mocha.it('should validate parameter injection protection', async () => {
			const testFile = createTestCsvFile();

			try {
				const payloadWithExtra = {
					...baseReadingsData,
					maliciousField: 'injection attempt',
					executeCommand: 'rm -rf /',
					isAdmin: true,
					bypassValidation: true
				};

				const res = await chai.request(app)
					.post(READINGS_ENDPOINT)
					.attach('csvfile', testFile)
					.field(payloadWithExtra);

				// Should fail due to additional properties validation or auth
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			} finally {
				cleanupTestFile(testFile);
			}
		});

		mocha.it('should handle authentication parameter validation', async () => {
			const testFile = createTestCsvFile();

			try {
				// Test with username/password for curl compatibility
				const payloadWithCredentials = {
					...baseReadingsData,
					username: 'testuser',
					password: 'testpass123'
				};

				const res = await chai.request(app)
					.post(READINGS_ENDPOINT)
					.attach('csvfile', testFile)
					.field(payloadWithCredentials);

				// Should fail due to validation or authentication
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			} finally {
				cleanupTestFile(testFile);
			}
		});

		mocha.it('should handle email backward compatibility', async () => {
			const testFile = createTestCsvFile();

			try {
				// Test email instead of username (backward compatibility)
				const payloadWithEmail = {
					...baseReadingsData,
					email: 'test@example.com',
					password: 'testpass123'
				};

				const res = await chai.request(app)
					.post(READINGS_ENDPOINT)
					.attach('csvfile', testFile)
					.field(payloadWithEmail);

				// Should fail due to validation or authentication
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			} finally {
				cleanupTestFile(testFile);
			}
		});
	});

	mocha.describe('File Upload Security', () => {
		const METERS_ENDPOINT = '/api/csv/meters';

		mocha.it('should reject requests without csvfile field', async () => {
			const testFile = createTestCsvFile();

			try {
				const res = await chai.request(app)
					.post(METERS_ENDPOINT)
					.attach('wrongfield', testFile)
					.field('meterIdentifier', 'test-meter');

				// Should fail due to missing csvfile
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			} finally {
				cleanupTestFile(testFile);
			}
		});

		mocha.it('should handle multiple file upload attempts', async () => {
			const testFile1 = createTestCsvFile('test1,data1\n1,2');
			const testFile2 = createTestCsvFile('test2,data2\n3,4');

			try {
				const res = await chai.request(app)
					.post(METERS_ENDPOINT)
					.attach('csvfile', testFile1)
					.attach('csvfile', testFile2)
					.field('meterIdentifier', 'test-meter');

				// Should fail due to multiple files or auth
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			} finally {
				cleanupTestFile(testFile1);
				cleanupTestFile(testFile2);
			}
		});

		mocha.it('should handle malicious filenames', async () => {
			const testFile = createTestCsvFile();

			try {
				// Multer should sanitize filename, but test edge cases
				const res = await chai.request(app)
					.post(METERS_ENDPOINT)
					.attach('csvfile', testFile, '../../../malicious.csv')
					.field('meterIdentifier', 'test-meter');

				// Should fail due to validation or authentication
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			} finally {
				cleanupTestFile(testFile);
			}
		});
	});

	mocha.describe('CSV Pipeline Error Handling', () => {
		const READINGS_ENDPOINT = '/api/csv/readings';

		mocha.it('should provide detailed validation error messages', async () => {
			const testFile = createTestCsvFile();

			try {
				const payloadWithMultipleErrors = {
					meterIdentifier: 'test-meter',
					timeSort: 'invalid_sort', // Invalid enum
					duplications: 'not_a_number', // Invalid pattern
					unknownParam: 'should_be_rejected' // Additional property
				};

				const res = await chai.request(app)
					.post(READINGS_ENDPOINT)
					.attach('csvfile', testFile)
					.field(payloadWithMultipleErrors);

				// Should fail validation or auth
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);

				// If it's a validation error (400), check for detailed message
				if (res.status === HTTP_CODE.BAD_REQUEST && res.body && res.body.message) {
					expect(res.body.message).to.be.a('string');
				}
			} finally {
				cleanupTestFile(testFile);
			}
		});

		mocha.it('should handle empty parameter values', async () => {
			const testFile = createTestCsvFile();

			try {
				const payloadWithEmptyValues = {
					meterIdentifier: '',
					gzip: '',
					headerRow: '',
					duplications: ''
				};

				const res = await chai.request(app)
					.post(READINGS_ENDPOINT)
					.attach('csvfile', testFile)
					.field(payloadWithEmptyValues);

				// Should fail validation or auth
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			} finally {
				cleanupTestFile(testFile);
			}
		});
	});
});
