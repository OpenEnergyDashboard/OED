/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the readings retrieval API. */

const moment = require('moment');
const { chai, mocha, expect, app, testDB } = require('../common');
const { TimeInterval } = require('../../../common/TimeInterval');
const {insertUnits, insertConversions, insertMeters, insertGroups} = require('../../util/insertData');
const Unit = require('../../models/Unit');
const Point = require('../../models/Point');
const { redoCik } = require('../../services/graph/redoCik');
const ETERNITY = TimeInterval.unbounded();
const DAY = moment.duration({ 'days': 1 });



async function readyTest() {
	const conn = testDB.getConnection();
	const unitData = ['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT,
		'', Unit.displayableType.ALL, true, 'OED created standard unit'];
	const unitData2 = ['Electric_Utility', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'];
	const conversionData = ['Electric_Utility', 'kWh', false, 1, 0, 'Electric_Utility → kWh'];
	const meterData = ['Electric Utility kWh', 'Electric_Utility', 'kWh', true, undefined, 'special meter', 'data/unit/quantity1-5.csv', false];
	const groupData = ['Electric Utility 1-5 + 2-6 kWh', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility kWh 2-6'], []];
	await insertUnits([unitData, unitData2], conn);
	await insertConversions([conversionData], conn);
	await insertMeters([meterData], conn);
	await insertGroups([groupData], conn);
	await redoCik(conn);
	// meterUnit = (await Unit.getByName(meterData[1], conn)).id;
	// meterGraphicUnit = (await Unit.getByName(meterData[2], conn)).id;
}

mocha.describe('readings API', () => {
	// mocha.beforeEach(async () => {

	// });
	

	mocha.describe('for line charts', () => {
		mocha.describe('for meters', () => {
  			mocha.it('rejects requests without a timeInterval', async () => {
				const res = await chai.request(app).get('/api/unitReadings/line/meters/1');
				expect(res).to.have.status(400);
			});
			mocha.it('reject if request does not have graphicUnitID', async () => {
				const res = await chai.request(app).get('/api/unitReadings/line/meters/1?timeInterval=all');
				expect(res).to.have.status(400);
			});   
			// A reading should have a reading, startTimestamp, and endTimestamp
			mocha.it('response should have a valid 5 readings and timestamps, ', async () => {
				await readyTest();
				const res = await chai.request(app).get(`/api/unitReadings/line/meters/1?timeInterval=all&graphicUnitId=1`);
				expect(res).to.be.json;
				expect(res).to.not.have.status(400);
				for (let i = 0; i < 5; ++i) {
					expect(res.body).to.have.property('1').to.have.property(`${i}`).to.have.property('reading');
					expect(res.body).to.have.property('1').to.have.property(`${i}`).to.have.property('startTimestamp');
					expect(res.body).to.have.property('1').to.have.property(`${i}`).to.have.property('endTimestamp');
				}
			});
		});

		mocha.describe('for groups', () => {
			mocha.it('rejects requests without a timeInterval', async () => {
				const res = await chai.request(app).get('/api/unitReadings/line/groups/1');
				expect(res).to.have.status(400);
			});
			mocha.it('reject if request does not have graphicUnitID', async () => {
				const res = await chai.request(app).get('/api/unitReadings/line/groups/1?timeInterval=all')
				expect(res).to.have.status(400);
			});
			mocha.it('response should have a valid reading', async () => {
				await readyTest();
				const res = await chai.request(app).get(`/api/unitReadings/line/meters/1?timeInterval=all&graphicUnitId=1`);
				expect(res).to.be.json;
				expect(res).to.not.have.status(400);
				console.log(res.body);
			});
		});
	});

 	/* mocha.describe('for bar charts', () => {
		mocha.describe('for meters', () => {
			mocha.it('rejects requests without a timeInterval or barDuration', async () => {
				const res = await chai.request(app).get('/api/unitReadings/bar/meters/1');
				expect(res).to.have.status(400);
			});
			mocha.it('rejects requests without a barDuration', async () => {
				const res = await chai.request(app).get('/api/unitReadings/bar/meters/1')
					.query({ timeInterval: ETERNITY.toString() });
				expect(res).to.have.status(400);
			});
			mocha.it('rejects requests without a timeInterval', async () => {
				const res = await chai.request(app).get('/api/unitReadings/bar/meters/1')
					.query({ barDuration: DAY.toISOString() });
				expect(res).to.have.status(400);
			});
			mocha.it('reject if request does not have graphicUnitID', async () => {
				const res = await chai.request(app).get('/api/unitReadings/bar/meters/1?timeInterval=all')
				expect(res).to.have.status(400);
			});
		});

		mocha.describe('for groups', () => {
			mocha.it('rejects requests without a timeInterval or barDuration', async () => {
				const res = await chai.request(app).get('/api/unitReadings/bar/groups/1');
				expect(res).to.have.status(400);
			});
			mocha.it('rejects requests without a barDuration', async () => {
				const res = await chai.request(app).get('/api/unitReadings/bar/groups/1')
					.query({ timeInterval: ETERNITY.toString() });
				expect(res).to.have.status(400);
			});
			mocha.it('rejects requests without a timeInterval', async () => {
				const res = await chai.request(app).get('/api/unitReadings/bar/groups/1')
					.query({ barDuration: DAY.toISOString() });
				expect(res).to.have.status(400);
			});
			mocha.it('reject if request does not have graphicUnitID', async () => {
				const res = await chai.request(app).get('/api/unitReadings/bar/groups/1?timeInterval=all')
				expect(res).to.have.status(400);
			});
		});
	});  */
});