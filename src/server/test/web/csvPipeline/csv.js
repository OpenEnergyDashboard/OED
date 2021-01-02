const { chai, mocha, expect, app, testDB, testUser } = require('../../common');
const Meter = require('../../../models/Meter');

mocha.describe('csv API', () => {
	mocha.it('should exist on the route', async () => {
		const res = await chai.request(app).get('/api/csv');
		console.log(res);
		expect(res).to.have.status(200);
	});
});