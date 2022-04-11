/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the readings retrieval API. */

const moment = require('moment');
const { chai, mocha, expect, app } = require('../common');
const { TimeInterval } = require('../../../common/TimeInterval');

const ETERNITY = TimeInterval.unbounded();
const DAY = moment.duration({ 'days': 1 });

mocha.describe('readings API', () => {
	mocha.describe('for line charts', () => {
		mocha.describe('for meters', () => {
			mocha.it('rejects requests without a timeInterval', async () => {
				const res = await chai.request(app).get('/api/unitReadings/line/meters/1');
				expect(res).to.have.status(400);
			});
			// TODO check if request does not have graphicUnitID
		});

		mocha.describe('for groups', () => {
			mocha.it('rejects requests without a timeInterval', async () => {
				const res = await chai.request(app).get('/api/unitReadings/line/groups/1');
				expect(res).to.have.status(400);
			});
			// TODO check if does not have graphicUnitID
		});
	});

	mocha.describe('for bar charts', () => {
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
			// TODO check if request does not have graphicUnitID
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
			// TODO check if request does not have graphicUnitID
		});
	});
});
