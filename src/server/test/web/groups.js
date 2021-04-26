/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the groups API. */

const { chai, mocha, expect, app, testUser, testDB } = require('../common');
const bcrypt = require('bcryptjs');
const Group = require('../../models/Group');
const Meter = require('../../models/Meter');
const Point = require('../../models/Point');
const User = require('../../models/User');
const gps = new Point(90, 45);

mocha.describe('groups API', () => {
	let groupA;
	let groupB;
	let groupC;
	let meterA;
	let meterB;
	let meterC;
	mocha.beforeEach(async () => {
		const conn = testDB.getConnection();
		/*
			* Groups and meters are created in the following hierarchy.
			* group A
			* - meter A
			* - group B
			* - - meter B
			* - - group C
			* - - - meter C
			*/
		groupA = new Group(undefined, 'A');
		groupB = new Group(undefined, 'B');
		groupC = new Group(undefined, 'C');
		await Promise.all([groupA, groupB, groupC].map(group => group.insert(conn)));
		meterA = new Meter(undefined, 'A', null, false, true, Meter.type.MAMAC, null, gps);
		meterB = new Meter(undefined, 'B', null, false, true, Meter.type.MAMAC, null, gps);
		meterC = new Meter(undefined, 'C', null, false, true, Meter.type.METASYS, null, gps);
		await Promise.all([meterA, meterB, meterC].map(meter => meter.insert(conn)));

		await Promise.all([groupA.adoptMeter(meterA.id, conn), groupA.adoptGroup(groupB.id, conn),
		groupB.adoptGroup(groupC.id, conn), groupB.adoptMeter(meterB.id, conn),
		groupC.adoptMeter(meterC.id, conn)]);
	});
	mocha.describe('retrieval', () => {
		mocha.it('returns the list of existing groups', async () => {
			const res = await chai.request(app).get('/api/groups');
			expect(res).to.have.status(200);
			expect(res).to.be.json;
			expect(res.body).to.be.a('array').with.a.lengthOf(3);
			expect(res.body).to.deep.include.members([groupA, groupB, groupC]);
		});
		mocha.it('returns the immediate children of a group', async () => {
			const res = await chai.request(app).get(`/api/groups/children/${groupA.id}`);
			expect(res).to.have.status(200);
			expect(res).to.be.json;
			expect(res.body).to.have.property('meters');
			expect(res.body).to.have.property('groups');
			expect(res.body.meters).to.have.a.lengthOf(1).and.include(meterA.id);
			expect(res.body.groups).to.have.a.lengthOf(1).and.include(groupB.id);
		});
		mocha.it('returns the deep child meters of a group', async () => {
			const res = await chai.request(app).get(`/api/groups/deep/meters/${groupA.id}`);
			expect(res).to.have.status(200);
			expect(res).to.be.json;
			expect(res.body).to.have.a.property('deepMeters');
			expect(res.body.deepMeters).to.include.members([meterA.id, meterB.id, meterC.id]);
		});
		mocha.it('returns the deep child groups of a group', async () => {
			const res = await chai.request(app).get(`/api/groups/deep/groups/${groupA.id}`);
			expect(res).to.have.status(200);
			expect(res).to.be.json;
			expect(res.body).to.have.a.property('deepGroups');
			expect(res.body.deepGroups).to.include.members([groupB.id, groupC.id]);
		});
	});

	mocha.describe('modification API', () => {
		let token;
		mocha.before(async () => {
			let res = await chai.request(app).post('/api/login')
				.send({ email: testUser.email, password: testUser.password });
			token = res.body.token;
		});
		mocha.describe('create endpoint', () => {
			mocha.it('rejects all requests without a token with 403', async () => {
				const res = await chai.request(app).post('/api/groups/create').type('json').send({});
				expect(res).to.have.status(403);
			});
			mocha.it('rejects all requests with an invalid token with 401', async () => {
				const res = await chai.request(app).post('/api/groups/create').set('token', token + 'nope').type('json').send({});
				expect(res).to.have.status(401);
			});
			mocha.describe('properly process roles:', () => {
				for (const role of Object.keys(User.role)) {
					const isAdmin = User.role[role] === User.role.ADMIN;
					const message = `should ${isAdmin ? 'accept' : 'reject'} requests from ${role}`;
					// Response status code should be 403 if improper role, but 400 if proper role, but improper user input.
					const expectedResponseStatus = isAdmin ? 400 : 403;
					mocha.it(message, async () => {
						let currentToken;
						let res;
						// insert test user
						const conn = testDB.getConnection();
						const password = 'password';
						const hashedPassword = await bcrypt.hash(password, 10);
						const unauthorizedUser = new User(undefined, `${role}@example.com`, hashedPassword, User.role[role]);
						await unauthorizedUser.insert(conn);
						unauthorizedUser.password = password;

						// login
						res = await chai.request(app).post('/api/login')
							.send({ email: unauthorizedUser.email, password: unauthorizedUser.password });
						currentToken = res.body.token;
						// create
						res = await chai.request(app).post('/api/groups/create').set('token', currentToken);
						expect(res).to.have.status(expectedResponseStatus);
					});

				}
			});
			mocha.it('creates new groups when given valid parameters', async () => {
				// Create a duplicate of Group C with a different name.
				const res = await chai.request(app).post('/api/groups/create').type('json').set('token', token).send({
					name: 'D',
					childGroups: [groupB.id],
					childMeters: [meterA.id]
				});
				expect(res).to.have.status(200);

				// Get the results of the API call.
				const res2 = await chai.request(app).get('/api/groups');
				expect(res2).to.have.status(200);
				expect(res2).to.be.json;
				expect(res2.body).to.have.lengthOf(4);

				// These are the meters the beforeEach creates.
				let priorMeters = new Set([groupA.id, groupB.id, groupC.id]);
				// These are the IDs of the groups created by the API call.
				let newGroups = res2.body.map(group => group.id).filter(x => !priorMeters.has(x));
				expect(newGroups).to.have.lengthOf(1);
			});
		});
		mocha.describe('edit endpoint', () => {
			mocha.it('rejects all requests without a token with 403', async () => {
				const res = await chai.request(app).put('/api/groups/edit').type('json').send({});
				expect(res).to.have.status(403);
			});
			mocha.it('rejects all requests with an invalid token with 401', async () => {
				const res = await chai.request(app).put('/api/groups/edit').set('token', token + 'nope').type('json').send({});
				expect(res).to.have.status(401);
			});
			mocha.describe('properly process roles', () => {
				for (const role of Object.keys(User.role)) {
					const isAdmin = User.role[role] === User.role.ADMIN;
					const message = `should ${isAdmin ? 'accept' : 'reject'} requests from ${role}`;
					// Response status code should be 403 if improper role, but 400 if proper role, but improper user input.
					const expectedResponseStatus = isAdmin ? 400 : 403;
					mocha.it(message, async () => {
						let currentToken;
						let res;
						// insert test user
						const conn = testDB.getConnection();
						const password = 'password';
						const hashedPassword = await bcrypt.hash(password, 10);
						const unauthorizedUser = new User(undefined, `${role}@example.com`, hashedPassword, User.role[role]);
						await unauthorizedUser.insert(conn);
						unauthorizedUser.password = password;

						// login
						res = await chai.request(app).post('/api/login')
							.send({ email: unauthorizedUser.email, password: unauthorizedUser.password });
						currentToken = res.body.token;
						// edit
						res = await chai.request(app).put('/api/groups/edit').set('token', currentToken);
						expect(res).to.have.status(expectedResponseStatus);
					});

				}
			});
			mocha.it('allows adding a new child meter to a group', async () => {
				const conn = testDB.getConnection();
				const meterD = new Meter(undefined, 'D', null, false, true, Meter.type.MAMAC, null, gps);
				await meterD.insert(conn);
				let res = await chai.request(app).put('/api/groups/edit').set('token', token).type('json').send({
					id: groupC.id,
					name: groupC.name,
					childGroups: [],
					childMeters: [meterC.id, meterD.id]
				});
				expect(res).to.have.status(200);

				res = await chai.request(app).get(`/api/groups/children/${groupC.id}`);
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.have.property('meters');
				expect(res.body).to.have.property('groups');
				expect(res.body.meters).to.have.a.lengthOf(2).and.include.members([meterC.id, meterD.id]);
				expect(res.body.groups).to.have.a.lengthOf(0);
			});
			mocha.it('allows adding a new child group to a group', async () => {
				const conn = testDB.getConnection();
				const groupD = new Group(undefined, 'D');
				await groupD.insert(conn);
				let res = await chai.request(app).put('/api/groups/edit').set('token', token).type('json').send({
					id: groupC.id,
					name: groupC.name,
					childGroups: [groupD.id],
					childMeters: [meterC.id]
				});
				expect(res).to.have.status(200);

				res = await chai.request(app).get(`/api/groups/children/${groupC.id}`);
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.have.property('meters');
				expect(res.body).to.have.property('groups');
				expect(res.body.meters).to.have.a.lengthOf(1).and.include.members([meterC.id]);
				expect(res.body.groups).to.have.a.lengthOf(1).and.include(groupD.id);
			});
		});
	});
});
