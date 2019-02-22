/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the readings retrieval API. */

const moment = require('moment');
const { chai, mocha, expect, app } = require('./common');
const { TimeInterval } = require('../../../common/TimeInterval');

const ETERNITY = TimeInterval.unbounded();
const DAY = moment.duration({'days': 1});

mocha.describe('readings API', () => {
	mocha.describe('for line charts', () => {
		mocha.describe('for meters', () => {
			mocha.it('rejects requests without a timeInterval', async () => {
				const res = await chai.request(app).get('/api/readings/line/meters/1');
				expect(res).to.have.status(400);
			});
			mocha.it('returns nothing for meters that do not exist', async () => {
				const res = await chai.request(app).get('/api/readings/line/meters/1')
					.query({timeInterval: ETERNITY.toString()});
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.have.property('1');
				expect(res.body['1']).to.have.length(0);
			});
		});
		mocha.describe('for groups', () => {
			mocha.it('rejects requests without a timeInterval', async () => {
				const res = await chai.request(app).get('/api/readings/line/groups/1');
				expect(res).to.have.status(400);
			});
			mocha.it('returns nothing for groups that do not exist', async () => {
				const res = await chai.request(app).get('/api/readings/line/groups/1')
					.query({timeInterval: ETERNITY.toString()});
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.have.property('1');
				expect(res.body['1']).to.have.length(0);
			});
		});
	});
	mocha.describe('for bar charts', () => {
		mocha.describe('for meters', () => {
			mocha.it('rejects requests without a timeInterval or barDuration', async () => {
				const res = await chai.request(app).get('/api/readings/bar/meters/1');
				expect(res).to.have.status(400);
			});
			mocha.it('rejects requests without a barDuration', async () => {
				const res = await chai.request(app).get('/api/readings/bar/meters/1')
					.query({timeInterval: ETERNITY.toString()});
				expect(res).to.have.status(400);
			});
			mocha.it('rejects requests without a timeInterval', async () => {
				const res = await chai.request(app).get('/api/readings/bar/meters/1')
					.query({barDuration: DAY.toISOString()});
				expect(res).to.have.status(400);
			});
			mocha.it('returns nothing for meters that do not exist', async () => {
				const res = await chai.request(app).get('/api/readings/bar/meters/1')
					.query({barDuration: DAY.toISOString(), timeInterval: ETERNITY.toString()});
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.have.property('1');
				expect(res.body['1']).to.have.length(0);
			});
		});
		mocha.describe('for groups', () => {
			mocha.it('rejects requests without a timeInterval or barDuration', async () => {
				const res = await chai.request(app).get('/api/readings/bar/groups/1');
				expect(res).to.have.status(400);
			});
			mocha.it('rejects requests without a barDuration', async () => {
				const res = await chai.request(app).get('/api/readings/bar/groups/1')
					.query({timeInterval: ETERNITY.toString()});
				expect(res).to.have.status(400);
			});
			mocha.it('rejects requests without a timeInterval', async () => {
				const res = await chai.request(app).get('/api/readings/bar/groups/1')
					.query({barDuration: DAY.toISOString()});
				expect(res).to.have.status(400);
			});
			mocha.it('returns nothing for groups that do not exist', async () => {
				const res = await chai.request(app).get('/api/readings/bar/groups/1')
					.query({barDuration: DAY.toISOString(), timeInterval: ETERNITY.toString()});
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.have.property('1');
				expect(res.body['1']).to.have.length(0);
			});
		});
	});
});
