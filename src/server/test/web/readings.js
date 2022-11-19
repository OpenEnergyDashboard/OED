/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the readings retrieval API. */

const moment = require('moment');
const { chai, mocha, expect, app, testDB, recreateDB } = require('../common');
const { TimeInterval } = require('../../../common/TimeInterval');
const {insertUnits, insertConversions, insertMeters, insertGroups} = require('../../util/insertData');
const Unit = require('../../models/Unit');
const Point = require('../../models/Point');
const { redoCik } = require('../../services/graph/redoCik');
const { refreshAllReadingViews } = require('../../services/refreshAllReadingViews');
const ETERNITY = TimeInterval.unbounded();
const DAY = moment.duration({ 'days': 1 });


/**
 * Rather than use mocha.beforeEach, use this helper function to initialize test data. This is done as most of these tests don't
 * require this data to function as intended, so we can avoid doing database calls for tests that don't need them. 
 */
async function readyTest() {
	await recreateDB();
	const conn = testDB.getConnection();
	// Small sample of the special units, conversions, meters, and groups as defined in src/server/data/automatedTestingData
	// Electric utility/kWh was chosen because a) it seems a typical use case b) it gives a nice graphicUnitId of 1
	const unitData = ['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT,
		'', Unit.displayableType.ALL, true, 'OED created standard unit'];
	const unitData2 = ['Electric_Utility', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit'];
	const conversionData = ['Electric_Utility', 'kWh', false, 1, 0, 'Electric_Utility → kWh'];
	const meterData = ['Electric Utility kWh', 'Electric_Utility', 'kWh', true, undefined, 'special meter', 'data/unit/quantity1-5.csv', false];
	const meterData2 = ['Electric Utility kWh 2-6', 'Electric_Utility', 'kWh', true, undefined, 'special meter', 'data/unit/quantity2-6.csv', false];
	const groupData = ['Electric Utility 1-5 + 2-6 kWh', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility kWh 2-6'], []];
	await insertUnits([unitData, unitData2], conn);
	await insertConversions([conversionData], conn);
	await insertMeters([meterData, meterData2], conn);
	await insertGroups([groupData], conn);
	await redoCik(conn);
	await refreshAllReadingViews();
}

mocha.describe('readings API', () => {
 	mocha.describe('for line charts', () => {
		// The tests are the same for meters and groups, so we will just use a loop
		let tests = ['meters', 'groups'];
		tests.forEach((test) => {
			mocha.describe(`for ${test}`, () => {
				// A request is required to have both timeInterval and graphicUnitId as parameters
				mocha.it('rejects requests without a timeInterval or graphicUnitId', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/line/${test}/1`);
				  	expect(res).to.have.status(400);
			  	});
			  	mocha.it('reject if request does not have timeInterval', async () => {
				  	const res = await chai.request(app).get(`/api/unitReadings/line/${test}/1`)
					  	.query({graphicUnitId: 1});
				  	expect(res).to.have.status(400);
			  	});  
			  	mocha.it('reject if request does not have graphicUnitID', async () => {
				  	const res = await chai.request(app).get(`/api/unitReadings/line/${test}/1`)
					  	.query({timeInterval: ETERNITY.toString()});
				  	expect(res).to.have.status(400);
			  	});   
			  	// A reading response should have a reading, startTimestamp, and endTimestamp key
			  	mocha.it('response should have valid reading and timestamps,', async () => {
					await readyTest();
					const res = await chai.request(app).get(`/api/unitReadings/line/${test}/1`)
						.query({timeInterval: ETERNITY.toString(), graphicUnitId: 1});
					// unitReadings should be returning json 
					expect(res).to.be.json;
					// the route should not return a bad request
					expect(res).to.not.have.status(400);

					expect(res.body).to.have.property('1').to.have.property(`0`).to.have.property('reading');
					expect(res.body).to.have.property('1').to.have.property(`0`).to.have.property('startTimestamp');
					expect(res.body).to.have.property('1').to.have.property(`0`).to.have.property('endTimestamp');
					  
			  	});
		  	});
		})
	});  

 	mocha.describe('for bar charts', () => {
		// The logic here is effectively the same as the line charts, however bar charts have an added
		// barWidthDays parameter that must me accounted for, which adds a few extra steps
		let tests = ['meters', 'groups'];
		tests.forEach((test) => {
			mocha.describe(`for ${test}`, () => {
				mocha.it('rejects requests without a timeInterval or barWidthDays or graphicUnitId', async () => {
				    const res = await chai.request(app).get(`/api/unitReadings/bar/${test}/1`);
				    expect(res).to.have.status(400);
				});
				mocha.it('rejects requests without a barWidthDays', async () => {
				    const res = await chai.request(app).get(`/api/unitReadings/bar/${test}/1`)
					   .query({ timeInterval: ETERNITY.toString(), graphicUnitId : 1 });
				    expect(res).to.have.status(400);
				});
				mocha.it('rejects requests without a timeInterval', async () => {
				   	const res = await chai.request(app).get(`/api/unitReadings/bar/${test}/1`)
					   .query({ barWidthDays: 1, graphicUnitId : 1 });
					expect(res).to.have.status(400);
			    });
				mocha.it('reject if request does not have graphicUnitID', async () => {
				   const res = await chai.request(app).get(`/api/unitReadings/bar/${test}/1`)
					   .query({timeInterval: ETERNITY.toString(), barWidthDays: 1});
				   expect(res).to.have.status(400);
			    });  
			    mocha.it('response should have a valid reading, startTimestamp, and endTimestamp', async () => {
				    await readyTest();
			 		const res = await chai.request(app).get(`/api/unitReadings/bar/${test}/1`)
					   .query({
							timeInterval: ETERNITY.toString(),
							barWidthDays: 1,
							graphicUnitId: 1 
						});
					expect(res).to.be.json;
					expect(res).to.not.have.status(400);

					expect(res.body).to.have.property('1').to.have.property(`0`).to.have.property('reading');
					expect(res.body).to.have.property('1').to.have.property(`0`).to.have.property('startTimestamp');
					expect(res.body).to.have.property('1').to.have.property(`0`).to.have.property('endTimestamp');
				});
		   });
		})
	});
});