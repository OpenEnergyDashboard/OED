/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { chai, mocha, expect, app, testUser } = require('../common');
const moment = require('moment');
const { log } = require('../../log');

mocha.describe('Log Routes', () => {
	let token, currentLogToDb;

	mocha.before(async () => {
		// Login to get authentication token
		const res = await chai.request(app).post('/api/login')
			.send({ username: testUser.username, password: testUser.password });
		token = res.body.token;

		// These tests insert and check for items in the DB. Normally the test setup in common.js
		// stops all messages  to the DB but this allows them to happen.
		// Grab the current value so can put it back. Unclear if absolutely needed but it is safer.
		currentLogToDb = log.logToDb;
		log.logToDb = true;
	});

	mocha.after(async () => {
		// Reset after tests done.
		log.logToDb = currentLogToDb;
	});

	mocha.describe('Basic API validation', () => {
		mocha.it('should return 200 for valid info message', async () => {
			const response = await chai.request(app)
				.post('/api/logs/info')
				.set('token', token)
				.send({ message: 'Valid info message' });
			expect(response.status).to.equal(200);
		});

		mocha.it('should return 400 for invalid info message', async () => {
			const response = await chai.request(app)
				.post('/api/logs/info')
				.set('token', token)
				.send({ message: '' });
			expect(response.status).to.equal(400);
		});

		mocha.it('should return 200 for valid warn message', async () => {
			const response = await chai.request(app)
				.post('/api/logs/warn')
				.set('token', token)
				.send({ message: 'Valid warn message' });
			expect(response.status).to.equal(200);
		});

		mocha.it('should return 400 for invalid warn message', async () => {
			const response = await chai.request(app)
				.post('/api/logs/warn')
				.set('token', token)
				.send({ message: '' });
			expect(response.status).to.equal(400);
		});

		mocha.it('should return 200 for valid error message', async () => {
			const response = await chai.request(app)
				.post('/api/logs/error')
				.set('token', token)
				.send({ message: 'Valid error message' });
			expect(response.status).to.equal(200);
		});

		mocha.it('should return 400 for invalid error message', async () => {
			const response = await chai.request(app)
				.post('/api/logs/error')
				.set('token', token)
				.send({ message: '' });
			expect(response.status).to.equal(400);
		});

		mocha.it('should return logs for valid date range and type', async () => {
			const response = await chai.request(app)
				.get('/api/logs/logsmsg/getLogsByDateRangeAndType')
				.set('token', token)
				.query({ timeInterval: '2023-01-01T00:00:00Z_2023-12-31T23:59:59Z', logTypes: 'INFO', logLimit: '10' });
			expect(response.status).to.equal(200);
			expect(response.body).to.be.an('array');
		});

		mocha.it('should return 400 for invalid date range and type', async () => {
			const response = await chai.request(app)
				.get('/api/logs/logsmsg/getLogsByDateRangeAndType')
				.set('token', token)
				.query({ timeInterval: 'invalid', logTypes: 'INVALID', logLimit: 'invalid' });
			expect(response.status).to.equal(400);
		});
	});

	// Enhanced insert-and-verify tests
	mocha.describe('Insert and verify log functionality', () => {
		mocha.it('should insert INFO log and retrieve it correctly', async () => {
			const testMessage = 'Test INFO message for retrieval';

			// Insert log via API
			const insertResponse = await chai.request(app)
				.post('/api/logs/info')
				.set('token', token)
				.send({ message: testMessage });
			expect(insertResponse.status).to.equal(200);

			// Retrieve and verify the log appears in results
			const retrieveResponse = await chai.request(app)
				.get('/api/logs/logsmsg/getLogsByDateRangeAndType')
				.set('token', token)
				.query({
					timeInterval: `${moment().subtract(1, 'minute').toISOString()}_${moment().add(1, 'minute').toISOString()}`,
					logTypes: 'INFO',
					logLimit: '100'
				});

			expect(retrieveResponse.status).to.equal(200);
			expect(retrieveResponse.body).to.be.an('array');

			// Find our test message in the results
			const testLog = retrieveResponse.body.find(log => log.logMessage === testMessage);
			expect(testLog).to.not.be.undefined;
			expect(testLog.logType).to.equal('INFO');
			expect(testLog.logMessage).to.equal(testMessage);
		});

		mocha.it('should filter logs by type correctly', async () => {
			const infoMessage = 'Test INFO for filtering';
			const warnMessage = 'Test WARN for filtering';
			const errorMessage = 'Test ERROR for filtering';

			// Insert different types of logs
			await chai.request(app)
				.post('/api/logs/info')
				.set('token', token)
				.send({ message: infoMessage });

			await chai.request(app)
				.post('/api/logs/warn')
				.set('token', token)
				.send({ message: warnMessage });

			await chai.request(app)
				.post('/api/logs/error')
				.set('token', token)
				.send({ message: errorMessage });

			// Query for only INFO logs
			const infoResponse = await chai.request(app)
				.get('/api/logs/logsmsg/getLogsByDateRangeAndType')
				.set('token', token)
				.query({
					timeInterval: `${moment().subtract(1, 'minute').toISOString()}_${moment().add(1, 'minute').toISOString()}`,
					logTypes: 'INFO',
					logLimit: '100'
				});

			expect(infoResponse.status).to.equal(200);
			// Should only contain one INFO log
			const infoBody = infoResponse.body;
			expect(infoBody.length).to.equal(1);
			const testInfoLog = infoBody[0];
			expect(testInfoLog.logType).to.equal('INFO');
			expect(testInfoLog.logMessage).to.equal(infoMessage);

			// Query for only WARN logs
			const warnResponse = await chai.request(app)
				.get('/api/logs/logsmsg/getLogsByDateRangeAndType')
				.set('token', token)
				.query({
					timeInterval: `${moment().subtract(1, 'minute').toISOString()}_${moment().add(1, 'minute').toISOString()}`,
					logTypes: 'WARN',
					logLimit: '100'
				});

			expect(warnResponse.status).to.equal(200);
			// Should only contain one WARN log
			const warnBody = warnResponse.body;
			expect(warnBody.length).to.equal(1);
			const testWarnLog = warnBody[0];
			expect(testWarnLog.logType).to.equal('WARN');
			expect(testWarnLog.logMessage).to.equal(warnMessage);

			// Query for only ERROR logs
			const errorResponse = await chai.request(app)
				.get('/api/logs/logsmsg/getLogsByDateRangeAndType')
				.set('token', token)
				.query({
					timeInterval: `${moment().subtract(1, 'minute').toISOString()}_${moment().add(1, 'minute').toISOString()}`,
					logTypes: 'ERROR',
					logLimit: '100'
				});

			expect(errorResponse.status).to.equal(200);
			// Should only contain one ERROR log
			const errorBody = errorResponse.body;
			expect(errorBody.length).to.equal(1);
			const testErrorLog = errorBody[0];
			expect(testErrorLog.logType).to.equal('ERROR');
			expect(testErrorLog.logMessage).to.equal(errorMessage);
		});

		mocha.it('should filter logs by multiple types', async () => {
			const infoMessage = 'Test INFO multi-type';
			const warnMessage = 'Test WARN multi-type';
			const errorMessage = 'Test ERROR multi-type';

			// Insert different types of logs
			await chai.request(app)
				.post('/api/logs/info')
				.set('token', token)
				.send({ message: infoMessage });

			await chai.request(app)
				.post('/api/logs/warn')
				.set('token', token)
				.send({ message: warnMessage });

			await chai.request(app)
				.post('/api/logs/error')
				.set('token', token)
				.send({ message: errorMessage });

			// Query for INFO and WARN logs
			const response = await chai.request(app)
				.get('/api/logs/logsmsg/getLogsByDateRangeAndType')
				.set('token', token)
				.query({
					timeInterval: `${moment().subtract(1, 'minute').toISOString()}_${moment().add(1, 'minute').toISOString()}`,
					logTypes: 'INFO,WARN',
					logLimit: '100'
				});

			expect(response.status).to.equal(200);

			// Should contain INFO and WARN logs, but not ERROR
			const infoLog = response.body.find(log => log.logMessage === infoMessage);
			const warnLog = response.body.find(log => log.logMessage === warnMessage);
			const errorLog = response.body.find(log => log.logMessage === errorMessage);

			expect(infoLog).to.not.be.undefined;
			expect(infoLog.logType).to.equal('INFO');
			expect(infoLog.logMessage).to.equal(infoMessage);

			expect(warnLog).to.not.be.undefined;
			expect(warnLog.logType).to.equal('WARN');
			expect(warnLog.logMessage).to.equal(warnMessage);

			// Should not be returned
			expect(errorLog).to.be.undefined;
		});

		mocha.it('should respect log limit parameter', async () => {
			const messagePrefix = 'Limit test message';

			// Insert multiple logs
			for (let i = 0; i < 5; i++) {
				await chai.request(app)
					.post('/api/logs/info')
					.set('token', token)
					.send({ message: `${messagePrefix} ${i}` });
			}

			// Query with limit of 2
			const response = await chai.request(app)
				.get('/api/logs/logsmsg/getLogsByDateRangeAndType')
				.set('token', token)
				.query({
					timeInterval: `${moment().subtract(1, 'minute').toISOString()}_${moment().add(1, 'minute').toISOString()}`,
					logTypes: 'INFO',
					logLimit: '2'
				});

			expect(response.status).to.equal(200);
			expect(response.body).to.be.an('array');

			// Should return exactly the limit
			expect(response.body.length).to.equal(2);
		});

		mocha.it('should handle date range filtering', async () => {
			const oldMessage = 'Old test message';
			const recentMessage = 'Recent test message';

			// Insert a log
			await chai.request(app)
				.post('/api/logs/info')
				.set('token', token)
				.send({ message: oldMessage });

			// Wait a moment, then insert another
			await new Promise(resolve => setTimeout(resolve, 1000));
			const cutoffTime = moment();
			await new Promise(resolve => setTimeout(resolve, 1000));

			await chai.request(app)
				.post('/api/logs/info')
				.set('token', token)
				.send({ message: recentMessage });

			// Query for logs after the cutoff time
			const response = await chai.request(app)
				.get('/api/logs/logsmsg/getLogsByDateRangeAndType')
				.set('token', token)
				.query({
					timeInterval: `${cutoffTime.toISOString()}_${moment().add(1, 'minute').toISOString()}`,
					logTypes: 'INFO',
					logLimit: '100'
				});

			expect(response.status).to.equal(200);

			// Should only contain the recent message
			const recentLog = response.body.find(log => log.logMessage === recentMessage);
			const oldLog = response.body.find(log => log.logMessage === oldMessage);

			expect(recentLog).to.not.be.undefined;
			expect(recentLog.logMessage).to.equal(recentMessage);
			// Should not be returned due to date filter
			expect(oldLog).to.be.undefined;
		});

		mocha.it('should return empty array when no logs match filters', async () => {
			// Insert some logs that should NOT be returned
			await chai.request(app)
				.post('/api/logs/info')
				.set('token', token)
				.send({ message: 'Info log that should not match' });

			await chai.request(app)
				.post('/api/logs/warn')
				.set('token', token)
				.send({ message: 'Warn log that should not match' });

			// Query for logs with a future date range - should exclude all existing logs
			const response = await chai.request(app)
				.get('/api/logs/logsmsg/getLogsByDateRangeAndType')
				.set('token', token)
				.query({
					timeInterval: `${moment().add(1, 'day').toISOString()}_${moment().add(2, 'days').toISOString()}`,
					logTypes: 'INFO',
					logLimit: '100'
				});

			expect(response.status).to.equal(200);
			expect(response.body).to.be.an('array');
			// Should be empty despite logs existing
			expect(response.body).to.have.lengthOf(0);
		});
	});
});
