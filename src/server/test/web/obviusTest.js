/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the API for retrieving meters, by artificially
 * inserting meters prior to executing the test code. */

const { chai, mocha, expect, app, testDB, testUser } = require('../common');
const User = require('../../models/User');
const Configfile = require('../../models/obvius/Configfile');
const bcrypt = require('bcryptjs');
const { insertUnits } = require('../../util/insertData');
const Unit = require('../../models/Unit');
const Meter = require('../../models/Meter.js');
const { Console } = require('console');

//expected names and ids for obvius meters.
const expMeterNames = [
	'mb-001.0', 'mb-001.1', 'mb-001.2', 'mb-001.3', 'mb-001.4', 'mb-001.5', 'mb-001.6', 'mb-001.7',
	'mb-001.8', 'mb-001.9', 'mb-001.10', 'mb-001.11', 'mb-001.12', 'mb-001.13', 'mb-001.14', 'mb-001.15',
	'mb-001.16', 'mb-001.17', 'mb-001.18', 'mb-001.19', 'mb-001.20', 'mb-001.21', 'mb-001.22', 'mb-001.23',
	'mb-001.24', 'mb-001.25', 'mb-001.26', 'mb-001.27'
];

const expMeterIDs = [
	1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28
];

mocha.describe('Obvius API', () => {
	mocha.describe('upload: ', () => {
		mocha.describe('authorized roles (Admin or Obvius):', () => {
			mocha.it('should accept requests from Admin users', async () => {
				const res = await chai.request(app).post('/api/obvius').send({ username: testUser.username, password: testUser.password });
				expect(res).to.have.status(406); // this passes role verification but fails due to improper input
				// test here for backwards compatibility using email parameter
				const res2 = await chai.request(app).post('/api/obvius').send({ email: testUser.username, password: testUser.password });
				expect(res2).to.have.status(406); // this passes role verification but fails due to improper input
			});
			mocha.it('should accept requests from Obvius users', async () => {
				const conn = testDB.getConnection();
				const password = 'password';
				const hashedPassword = await bcrypt.hash(password, 10);
				const obviusUser = new User(undefined, 'obivus@example.com', hashedPassword, User.role.OBVIUS);
				await obviusUser.insert(conn);
				obviusUser.password = password;
				const res = await chai.request(app).post('/api/obvius').send({ username: obviusUser.username, password: obviusUser.password });
				expect(res).to.have.status(406); // this passes role verification but fails due to improper input
				// test here for backwards compatibility using email parameter
				const res2 = await chai.request(app).post('/api/obvius').send({ email: obviusUser.username, password: obviusUser.password });
				expect(res2).to.have.status(406); // this passes role verification but fails due to improper input
			});
		})
		mocha.describe('unauthorized roles:', async () => {
			for (const role in User.role) {
				if (User.role[role] !== User.role.ADMIN && User.role[role] !== User.role.OBVIUS) {
					mocha.it(`should reject requests from ${role}`, async () => {
						const conn = testDB.getConnection();
						const password = 'password';
						const hashedPassword = await bcrypt.hash(password, 10);
						const unauthorizedUser = new User(undefined, `${role}@example.com`, hashedPassword, User.role[role]);
						await unauthorizedUser.insert(conn);
						unauthorizedUser.password = password;
						const res = await chai.request(app).post('/api/obvius').send({ username: unauthorizedUser.username, password: unauthorizedUser.password });
						// request should respond with http code of 401 for failed user
						expect(res).to.have.status(401);
						// Should also return expected message
						expect(res.text).equals("Got request to 'Obvius pipeline' with invalid authorization level. Obvius role is at least required to 'Obvius pipeline'.");
						// test here for backwards compatibility using email parameter
						const res2 = await chai.request(app).post('/api/obvius').send({ email: unauthorizedUser.username, password: unauthorizedUser.password });
						// request should respond with http code of 401 for failed user
						expect(res2).to.have.status(401);
						// Should also return expected message
						expect(res2.text).equals("Got request to 'Obvius pipeline' with invalid authorization level. Obvius role is at least required to 'Obvius pipeline'.");
					})
				}
			}
		});
		mocha.describe('obvius request modes', async () => {
			mocha.beforeEach(async () => {
				const conn = testDB.getConnection();
				// The kWh unit is not used in all tests but easier to just put in.
				const unitData = [
					{
						name: 'kWh',
						identifier: '',
						unitRepresent: Unit.unitRepresentType.QUANTITY,
						secInRate: 3600,
						typeOfUnit: Unit.unitType.UNIT,
						suffix: '',
						displayable: Unit.displayableType.ALL,
						preferredDisplay: true,
						note: 'OED created standard unit'
					}
				];
				await insertUnits(unitData, false, conn);
			});
			mocha.it('should reject requests without a mode', async () => {
				const password = 'password';
				const hashedPassword = await bcrypt.hash(password, 10);
				const obviusUser = new User(undefined, 'obivus@example.com', hashedPassword, User.role.OBVIUS);
				await obviusUser.insert(conn);
				obviusUser.password = password;
				const res = await chai.request(app).post('/api/obvius').send({ username: obviusUser.username, password: obviusUser.password });
				//should respond with 406, not acceptable
				expect(res).to.have.status(406);
				//should also return expected message
				expect(res.text).equals(`<pre>\nRequest must include mode parameter.\n</pre>\n`);
			});
			mocha.it('should accept status requests', async () => {
				const password = 'password';
				const hashedPassword = await bcrypt.hash(password, 10);
				const obviusUser = new User(undefined, 'obivus@example.com', hashedPassword, User.role.OBVIUS);
				await obviusUser.insert(conn);
				obviusUser.password = password;
				const requestMode = 'STATUS';
				const res = await chai.request(app).post('/api/obvius').send({ username: obviusUser.username, password: obviusUser.password, mode: requestMode });
				//should respond with 200, success
				expect(res).to.have.status(200);
				//should also return expected message
				expect(res.text).equals("<pre>\nSUCCESS\n</pre>\n");
			});
			mocha.it('should accept valid logfile uploads', async () => {
				const password = 'password';
				const hashedPassword = await bcrypt.hash(password, 10);
				const obviusUser = new User(undefined, 'obvius@example.com', hashedPassword, User.role.OBVIUS);
				await obviusUser.insert(conn);
				obviusUser.password = password;
				const logfileRequestMode = 'LOGFILEUPLOAD';

				// Adapted from ../obvius/README.md
				const logfilePath = 'src/server/test/web/obvius/mb-001.log.gz';

				//the upload of a logfile is the subject of the test
				const res = await chai.request(app)
					.post('/api/obvius')
					.field('username', obviusUser.username)
					.field('password', obviusUser.password)
					.field('mode', logfileRequestMode)
					.field('serialnumber', 'mb-001')
					.attach('files', logfilePath);
				//should respond with 200, success
				expect(res).to.have.status(200);
				//should also return expected message
				expect(res.text).equals("<pre>\nSUCCESS\nLogfile Upload IS PROVISIONAL</pre>\n");

			});
			mocha.it('should accept valid config file uploads', async () => {
				const password = 'password';
				const hashedPassword = await bcrypt.hash(password, 10);
				const obviusUser = new User(undefined, 'obvius@example.com', hashedPassword, User.role.OBVIUS);
				await obviusUser.insert(conn);
				obviusUser.password = password;
				const requestMode = 'CONFIGFILEUPLOAD';

				// Adapted from ../obvius/README.md
				const configFilePath = 'src/server/test/web/obvius/mb-001.ini.gz';

				const res = await chai.request(app)
					.post('/api/obvius')
					.field('username', obviusUser.username)
					.field('password', obviusUser.password)
					.field('mode', requestMode)
					.field('serialnumber', 'mb-001')
					.field('modbusdevice', '1234')
					.attach('files', configFilePath);

				//should respond with 200, success
				expect(res).to.have.status(200);
				//should also return expected message
				expect(res.text).equals("<pre>\nSUCCESS\nAcquired config log with (pseudo)filename mb-001-mb-1234.ini.</pre>\n");
			});
			mocha.it('should return accurate config file manifests', async () => {
				const password = 'password';
				const hashedPassword = await bcrypt.hash(password, 10);
				const obviusUser = new User(undefined, 'obvius@example.com', hashedPassword, User.role.OBVIUS);
				await obviusUser.insert(conn);
				obviusUser.password = password;
				const uploadRequestMode = 'CONFIGFILEUPLOAD';
				const manifestRequestMode = 'CONFIGFILEMANIFEST';
				const serialStart = 'mb-';
				const serialNumber = serialStart + '001';
				const modbusDevice = '1234'

				// Adapted from ../obvius/README.md
				const configFilePath = 'src/server/test/web/obvius/mb-001.ini.gz';
				const upload = await chai.request(app)
					.post('/api/obvius')
					.field('username', obviusUser.username)
					.field('password', obviusUser.password)
					.field('mode', uploadRequestMode)
					.field('serialnumber', serialNumber)
					.field('modbusdevice', modbusDevice)
					.attach('files', configFilePath);

				//logfile upload should respond with 200, success
				expect(upload).to.have.status(200);

				const res = await chai.request(app)
					.post('/api/obvius')
					.field('username', obviusUser.username)
					.field('password', obviusUser.password)
					.field('mode', manifestRequestMode);

				//logfile request should respond with 200, success
				expect(res).to.have.status(200);

				//get "all" config files to compare to response
				const allConfigfiles = await Configfile.getAll(conn);
				let response = '';
				for (f of allConfigfiles) {
					response += `CONFIGFILE,${serialNumber}-${serialStart}${modbusDevice}.ini,${f.hash},${f.created.format('YYYY-MM-DD hh:mm:ss')}`;
				}

				//the third line of the response should be the config file
				expect(res.text.split("\n")[2]).equals(response);

				//config file uploads should create accurate meter objects
				const allMeters = await Meter.getAll(conn);

				//mb-001.ini should make meters equal to expMeterNames.length
				expect(allMeters.length).to.equal(expMeterNames.length);

				//these arrays should vary for different submeters
				const meterNames = [];
				const meterIDs = [];

				//flags for meter fields (.type, .displayable, .enabled)
				const allMetersAreObvius = true;
				const allMetersAreNotDisplayable = true;
				const allMetersAreNotEnabled = true;

				for (const meter of allMeters) {
					//populate arrays with varying values in ascending order
					let currentName = meter.name;
					let idx = currentName.split('.')[1];
					meterNames[parseInt(idx)] = meter.name;
					meterIDs[meter.id - 1] = meter.id;
					//ensure each meter is obvius, not displayable, and not enabled
					if (meter.type != 'obvius') {
						allMetersAreObvius = false;
					}
					if (meter.displayable != false) {
						allMetersAreNotDisplayable = false;
					}
					if (meter.enabled != false) {
						allMetersAreNotEnabled = false;
					}
				}

				//flags for comparison between expected arrays and actual arrays
				let expectedNamesAreEqual = true;
				let expectedIDsAreEqual = true;

				//error message for more descriptive failures
				let allErrorMessagesNames = "";
				let allErrorMessagesIDs = "";


				//both arrays should be contain the same sequence of values
				for (let i = 0; i < expMeterNames.length; i++) {
					if (expMeterNames[i] != meterNames[i]) {
						expectedNamesAreEqual = false;
						allErrorMessagesNames += "Meter failed name comparison, Expected: " + expMeterNames[i] + " Actual: " + meterNames[i] + "\n";
					}

					if (expMeterIDs[i] != meterIDs[i]) {
						expectedIDsAreEqual = false;
						allErrorMessagesIDs += "Meter failed ID comparison. Expected: " + expMeterIDs[i] + " Actual: " + meterIDs[i] + "\n";

					}
				}

				//assertion for type, displayable, and enabled
				expect(allMetersAreObvius).to.equal(true);
				expect(allMetersAreNotDisplayable).to.equal(true);
				expect(allMetersAreNotEnabled).to.equal(true);

				//expected arrays should equal actual arrays
				expect(expectedNamesAreEqual).to.equal(true, allErrorMessagesNames);
				expect(expectedIDsAreEqual).to.equal(true, allErrorMessagesIDs);
			});
		});
	});
});