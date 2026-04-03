/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Run in OED Docker web container terminal/shell:
npm run testsome src/server/test/routes/logInjection.js */
const { chai, mocha, expect, app } = require('../common');
const sinon = require('sinon');
const { log } = require('../../log');

mocha.describe('Obvius Route - Log Injection Protection', () => {

	let infoStub;
	let warnStub;
	let errorStub;

	mocha.beforeEach(() => {
		infoStub = sinon.stub(log, 'info');
		warnStub = sinon.stub(log, 'warn');
		errorStub = sinon.stub(log, 'error');
	});

	mocha.afterEach(() => {
		sinon.restore();
	});

	mocha.it('Should sanitize CRLF injection in mode field', async () => {
		const maliciousMode = 'bad\nFAKE_LOG_ENTRY: admin logged in';
		const res = await chai.request(app)
			.post('/api/obvius')
			.type('form')
			.send({
				mode: maliciousMode,
				username: 'test@example.com',
				password: 'password'
			});
		expect(res.status).to.be.oneOf([200, 400, 401]);

		// Combine all logged messages
		const allLogs = [
			...infoStub.getCalls().map(c => c.args[0]),
			...warnStub.getCalls().map(c => c.args[0]),
			...errorStub.getCalls().map(c => c.args[0])
		];

		// Ensure something was logged
		expect(allLogs.length).to.be.greaterThan(0);

		allLogs.forEach(msg => {
			if (typeof msg === 'string') {
				expect(msg, 'Log should not contain newline').to.not.include('\n');
				expect(msg, 'Log should not contain carriage return').to.not.include('\r');
			}
		});
	});

	mocha.it('Should strip ANSI escape sequences from mode field', async () => {
		const maliciousMode = '\x1b[31mRED_TEXT\x1b[0m';
		const res = await chai.request(app)
			.post('/api/obvius')
			.type('form')
			.send({
				mode: maliciousMode,
				username: 'test@example.com',
				password: 'password'
			});
		expect(res.status).to.be.oneOf([200, 400, 401]);

        // Combine all logged messages
		const allLogs = [
			...infoStub.getCalls().map(c => c.args[0]),
			...warnStub.getCalls().map(c => c.args[0]),
			...errorStub.getCalls().map(c => c.args[0])
		];
		allLogs.forEach(msg => {
			if (typeof msg === 'string') {
				expect(msg, 'Log should not contain ANSI escape').to.not.include('\x1b');
			}
		});
	});
});