const { chai, mocha, expect, app, testDB, testUser } = require('../../common');
const Meter = require('../../../models/Meter');

const CSV_ROUTE = '/api/csv';

mocha.describe('csv API', () => {
	mocha.it('should exist on the route "/api/csv" ', async () => {
		const res = await chai.request(app).get(CSV_ROUTE);
		expect(res).to.have.status(200);
	});
	mocha.it('should be able to accept a post request to upload meter data.', async () => {
		const res = await chai.request(app).post(CSV_ROUTE)
		.field('mode', 'meter')
		.attach('csvfile', './sampleMeters.csv')
		console.log(res.text);
		expect(res).to.have.status(400); // Uploading meters is not implemented
	});
});