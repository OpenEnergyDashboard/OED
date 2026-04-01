const { chai, mocha, expect, app, testDB } = require('../common');
const fs = require('fs');
const assert = require('assert');
const path = require('path');
const { execFileSync } = require('child_process');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const sharedBody = { message: 'test' };
const sharedQuery = {
	logLimit: 10,
	timeInterval: 'LAST_24_HOURS',
	logTypes: 'info',
};
const raw = fs.readFileSync('src/server/test/routes/routes.json', 'utf8');
const routeData = JSON.parse(raw);
const ROUTES_DIR = path.resolve(__dirname, '../../routes');


/*This test is built to test the integrity of the standing auth middleware on routes along with the what
routes can each user access. The routes.json file holds all of the routes along with the different types
of authentication they have */

mocha.describe('Testing User Routes', () => {
	/*right here will be a router validation check to make sure every route is actually being 
	included in the test */
	mocha.describe('Check to make sure all routes have been included', () => {
		mocha.it('all routes in routes.json exist in the codebase', () => {
			const expectedLocal = loadExpectedLocalPaths();      // routes derived from routes.json 
			const actualLocal = findActualLocalPathsViaGrep();   // routes found in src/server/routes
			
			//set that holds routes in routes.json that are missing in the routes files
			const missing = [...expectedLocal].filter((p) => !actualLocal.has(p));
			//set that holds routes found in routes files that are not in route.json 
			const unexpected = [...actualLocal].filter((p) => !expectedLocal.has(p));

			if (missing.length || unexpected.length) {
				missing.sort();
				unexpected.sort();
				//assertion error message on the test failing
				assert.fail(
					[
						'',
						`${missing.length} route(s): (in routes.json but not found in src/server/routes):`,
						...missing.map((p) => `  - ${p}`),
						'',
						`${unexpected.length} route(s): (found in src/server/routes but not listed in routes.json):`,
						...unexpected.map((p) => `  - ${p}`),
						''
					].join('\n')
				);
			}
		});
	});

	//ADMIN USER TESTS
	mocha.describe('ADMIN USER', () => {
		//token value made outside of all test so it can be resued after being defined
		let token;
		//log in admin user and get token before each test
		mocha.beforeEach('admin user logs in', async () => {
			const conn = testDB.getConnection();
			const user = await TestUsers.admin();
			await user.insert(conn);
			const res = await chai.request(app).post('/api/login').send({
				username: user.username,
				password: TestUsers.adminPassword,
			});
			token = res.body.token;
		});
		//testing all of the admin auth routes against the admin user
		mocha.describe('Admin Auth GET + POST Routes', () => {
			//GET routes
			routeData.admin.GET.forEach((route) => {
				mocha.it(`GET ${route} - should allow admin`, async () => {
					const url = resolveParams(route);
					const req = chai
						.request(app)
						.get(url)
						.set('token', token)
						.query(sharedQuery);
					const res = await req.send(sharedBody);
					//status code 400, 202, or 200 is considered a pass an a route was accessed
					expect(res.status).to.be.oneOf([400, 202, 200]);
				});
			});
			//POST routes
			routeData.admin.POST.forEach((route) => {
				mocha.it(`POST ${route} - should allow admin`, async () => {
					const url = resolveParams(route);
					const req = chai.request(app).post(url).set('token', token);
					const res = await req.send(sharedBody);
					//status code 400,202,or 200 is considered a pass an a route was accessed
					expect(res.status).to.be.oneOf([200, 400, 202]);
				});
			});
		});

		//test all routes that have optional auth
		mocha.describe('Optional Auth GET Routes', () => {
			routeData.Optional.GET.forEach((route) => {
				mocha.it('GET ' + route + ' - should allow admin', async () => {
					const url = resolveParams(route);
					const req = chai
						.request(app)
						.get(url)
						.set('token', token)
						.query(sharedQuery);
					const res = await req.send(sharedBody);
					expect(res.status).to.be.oneOf([400, 202, 200, 500]);
				});
			});
		});
		//test the login route
		mocha.describe('User Auth POST Routes', () => {
			routeData.User.POST.forEach((route) => {
				mocha.it('POST ' + route + ' - should allow admin', async () => {
					const url = resolveParams(route);
					const req = chai.request(app).post(url).set('token', token);
					const res = await req.send(sharedBody);
					//should always pass with either 200 or 202 (shows 400 most likely because user is logged in
					//before it is tested)
					expect(res.status).to.be.oneOf([200, 400, 202]);
				});
			});
		});
		//Test the obvius route
		mocha.describe('Obvius Auth ALL Route', () => {
			//obvius route is listed as router.all but is a POST route
			routeData.Obvius.ALL.forEach((route) => {
				mocha.it('ALL' + route + ' - should allow admin', async () => {
					const url = resolveParams(route);
					const req = chai.request(app).post(url).set('token', token);
					const res = await req.send(sharedBody);
					expect(res.status).to.be.oneOf([406, 400, 202]);
				});
			});
		});

		//This is for any routes that do not have any auth middleware
		mocha.describe('Unauthenticated User GET + POST Routes', () => {
			routeData.UnauthenticatedUser.GET.forEach((route) => {
				mocha.it('GET ' + route + ' - should allow admin', async () => {
					const url = resolveParams(route);
					const req = chai.request(app).get(url).set('token', token);
					const res = await req.send(sharedBody);
					expect(res.status).to.be.oneOf([200, 400, 202]);
				});
			});
		});
	});
	//EXPORT USER TEST
	mocha.describe('EXPORT USER', () => {
		//create a new token variable for seperate user
		let token;
		//log in as user
		mocha.beforeEach('export user logs in', async () => {
			const conn = testDB.getConnection();
			const user = await TestUsers.export();
			await user.insert(conn);
			const res = await chai.request(app).post('/api/login').send({
				username: user.username,
				password: TestUsers.exportPassword,
			});
			token = res.body.token;
		});

		//test an export user against admin routes
		mocha.describe('Admin Auth GET + POST Routes', () => {
			routeData.admin.GET.forEach((route) => {
				mocha.it(`GET ${route} - shouldnt allow export`, async () => {
					const url = resolveParams(route);
					const req = chai
						.request(app)
						.get(url)
						.set('token', token)
						.query(sharedQuery);
					const res = await req.send(sharedBody);
					//status code of all these routes should be either a 401 or 403
					expect(res.status).to.be.oneOf([401, 403]);
				});
			});

			routeData.admin.POST.forEach((route) => {
				mocha.it('POST ' + route + ' - shouldnt allow export', async () => {
					const url = resolveParams(route);
					const req = chai.request(app).post(url).set('token', token);
					const res = await req.send(sharedBody);
					//status code of all these routes should be either a 401 or 403
					expect(res.status).to.be.oneOf([403, 401]);
				});
			});
		});
		//test export user against the optional auth routes
		mocha.describe('Optional Auth Routes', () => {
			routeData.Optional.GET.forEach((route) => {
				mocha.it('GET ' + route + ' - should allow export', async () => {
					const url = resolveParams(route);
					const req = chai
						.request(app)
						.get(url)
						.set('token', token)
						.query(sharedQuery);
					const res = await req.send(sharedBody);
					//status code 400, 202, 200, and 500 signifies access
					expect(res.status).to.be.oneOf([400, 202, 200, 500]);
				});
			});
		});
		//test export uaer against user route (just login - this should pass for every user that is given a role)
		mocha.describe('User Auth POST Routes', () => {
			routeData.User.POST.forEach((route) => {
				mocha.it('POST ' + route + ' - should allow export', async () => {
					const url = resolveParams(route);
					const req = chai.request(app).post(url).set('token', token);
					const res = await req.send(sharedBody);
					//should always pass with either 200 or 202 (shows 400 most likely because user is logged in
					//before it is tested)
					expect(res.status).to.be.oneOf([400, 200, 202]);
				});
			});
		});

		//test obvius user route
		mocha.describe('Obvius Auth ALL Route', () => {
			routeData.Obvius.ALL.forEach((route) => {
				mocha.it('ALL ' + route + ' - should allow export', async () => {
					const url = resolveParams(route);
					const req = chai.request(app).post(url).set('token', token);
					const res = await req.send(sharedBody);
					//should aways pass with a 406
					expect(res.status).to.be.oneOf([406]);
				});
			});
		});

		//testing unauthenticated user routes
		mocha.describe('Unauthenticated User GET Routes', () => {
			routeData.UnauthenticatedUser.GET.forEach((route) => {
				mocha.it('GET ' + route + ' - should allow export', async () => {
					const url = resolveParams(route);
					const req = chai.request(app).get(url).set('token', token);
					const res = await req.send(sharedBody);
					//should all pass with a 200, 400, or 202x
					expect(res.status).to.be.oneOf([200, 400, 202]);
				});
			});
		});
	});
	//OBVIUS USER TESTS
	mocha.describe('OBVIUS USER', () => {
		//new token variable created for this series of tests
		let token;
		//log in as obvius user before each route
		mocha.beforeEach('obvius user logs in', async () => {
			const conn = testDB.getConnection();
			const user = await TestUsers.obvius();
			await user.insert(conn);
			const res = await chai.request(app).post('/api/login').send({
				username: user.username,
				password: TestUsers.obviusPassword,
			});
			token = res.body.token;
		});
		//obvius user against admin auth routes
		mocha.describe('Admin Auth GET + POST Routes', () => {
			routeData.admin.GET.forEach((route) => {
				mocha.it(`GET ${route} - shouldnt allow obvius`, async () => {
					const url = resolveParams(route);
					const req = chai
						.request(app)
						.get(url)
						.set('token', token)
						.query(sharedQuery);
					const res = await req.send(sharedBody);
					//user should be forbiden access with either a 401 or 403
					expect(res.status).to.be.oneOf([401, 403]);
				});
			});

			routeData.admin.POST.forEach((route) => {
				mocha.it(`POST ${route} - shouldnt allow obvius`, async () => {
					const url = resolveParams(route);
					const req = chai.request(app).post(url).set('token', token);
					const res = await req.send(sharedBody);
					expect(res.status).to.be.oneOf([403, 401]);
				});
			});
		});
		//test for optional auth routes
		mocha.describe('Optional Auth GET Routes', () => {
			routeData.Optional.GET.forEach((route) => {
				mocha.it('GET ' + route + ' - should allow obvius', async () => {
					const url = resolveParams(route);
					const req = chai
						.request(app)
						.get(url)
						.set('token', token)
						.query(sharedQuery);
					const res = await req.send(sharedBody);
					//should pass with either a 400, 500, 202, and 200
					expect(res.status).to.be.oneOf([400, 202, 200, 500]);
				});
			});
		});
		//login user route
		mocha.describe('User Auth POST Routes', () => {
			routeData.User.POST.forEach((route) => {
				mocha.it('POST ' + route + ' - should allow obvius', async () => {
					const url = resolveParams(route);
					const req = chai.request(app).post(url).set('token', token);
					const res = await req.send(sharedBody);
					//should pass with a 200, might return 400 because user in already logged before testing route
					expect(res.status).to.be.oneOf([200, 400, 202]);
				});
			});
		});

		//obvius route for obvius user
		mocha.describe('Obvius Auth ALL Route', () => {
			routeData.Obvius.ALL.forEach((route) => {
				mocha.it('ALL ' + route + ' - should allow obvius', async () => {
					const url = resolveParams(route);
					const req = chai.request(app).post(url).set('token', token);
					const res = await req.send(sharedBody);
					//should pass with a 406, 400 or 200
					expect(res.status).to.be.oneOf([406, 400, 202]);
				});
			});
		});

		//unauthenticed routes for obvius user
		mocha.describe('Unauthenticated User GET Routes', () => {
			routeData.UnauthenticatedUser.GET.forEach((route) => {
				mocha.it('GET ' + route + ' - should allow obvius', async () => {
					const url = resolveParams(route);
					const req = chai.request(app).get(url).set('token', token);
					const res = await req.send(sharedBody);
					//should pass with a 200, 400, or 202
					expect(res.status).to.be.oneOf([200, 400, 202]);
				});
			});
		});
	});
	//CSV USER TESTS
	mocha.describe('CSV USER', () => {
		//new token variablels for a seperate user
		let token;
		//login iwht a new user for each route
		mocha.beforeEach('csv user logs in', async () => {
			const conn = testDB.getConnection();
			const user = await TestUsers.csv();
			await user.insert(conn);
			const res = await chai.request(app).post('/api/login').send({
				username: user.username,
				password: TestUsers.csvPassword,
			});
			token = res.body.token;
		});
		//csv user trying admin routes - should all forbid access with a 401 or 403
		mocha.describe('Admin Auth GET + POST Routes', () => {
			routeData.admin.GET.forEach((route) => {
				mocha.it(`GET ${route} - shouldnt allow csv`, async () => {
					const url = resolveParams(route);
					const req = chai
						.request(app)
						.get(url)
						.set('token', token)
						.query(sharedQuery);
					const res = await req.send(sharedBody);
					expect(res.status).to.be.oneOf([401, 403]);
				});
			});

			routeData.admin.POST.forEach((route) => {
				mocha.it(`POST ${route} - shouldnt allow csv`, async () => {
					const url = resolveParams(route);
					const req = chai.request(app).post(url).set('token', token);
					const res = await req.send(sharedBody);
					expect(res.status).to.be.oneOf([403, 401]);
				});
			});
		});

		//csv user for optional auth routes
		mocha.describe('Optional Auth GET Routes', () => {
			routeData.Optional.GET.forEach((route) => {
				mocha.it('GET ' + route + ' - should allow csv', async () => {
					const url = resolveParams(route);
					const req = chai
						.request(app)
						.get(url)
						.set('token', token)
						.query(sharedQuery);
					const res = await req.send(sharedBody);
					expect(res.status).to.be.oneOf([400, 202, 200, 500]);
				});
			});
		});
		//user should login - will return a 400 because user is already logged in
		mocha.describe('User Auth POST Routes', () => {
			routeData.User.POST.forEach((route) => {
				mocha.it('POST ' + route + ' - should allow csv', async () => {
					const url = resolveParams(route);
					const req = chai.request(app).post(url).set('token', token);
					const res = await req.send(sharedBody);
					expect(res.status).to.be.oneOf([200, 400, 202]);
				});
			});
		});
		//s=csv user logged in with a 406
		mocha.describe('Obvius Auth ALL Route', () => {
			routeData.Obvius.ALL.forEach((route) => {
				mocha.it('ALL ' + route + ' - should allow csv', async () => {
					const url = resolveParams(route);
					const req = chai.request(app).post(url).set('token', token);
					const res = await req.send(sharedBody);
					expect(res.status).to.be.oneOf([406, 400, 202]);
				});
			});
		});
		//csv user tries unauthenticated route
		mocha.describe('Unauthenticated User GET Routes', () => {
			routeData.UnauthenticatedUser.GET.forEach((route) => {
				mocha.it('GET ' + route + ' - should allow csv', async () => {
					const url = resolveParams(route);
					const req = chai.request(app).get(url).set('token', token);
					const res = await req.send(sharedBody);
					expect(res.status).to.be.oneOf([200, 400, 202]);
				});
			});
		});
	});
});
/*This class was made to to hold the user instances as objects - this was to create speration of credentials from the code so it
is easier to create, edit, and change*/
class TestUsers {
	static adminPassword = 'admin321#';
	static csvPassword = 'csv4321#';
	static exportPassword = 'export32';
	static obviusPassword = 'obvius321#';

	static async admin() {
		return new User(
			undefined,
			'adminuser',
			await bcrypt.hash(this.adminPassword, 10),
			User.role.ADMIN,
		);
	}

	static async csv() {
		return new User(
			undefined,
			'acsvuser',
			await bcrypt.hash(this.csvPassword, 10),
			User.role.CSV,
		);
	}

	static async export() {
		return new User(
			undefined,
			'exportuser',
			await bcrypt.hash(this.exportPassword, 10),
			User.role.EXPORT,
		);
	}

	static async obvius() {
		return new User(
			undefined,
			'obviususer',
			await bcrypt.hash(this.obviusPassword, 10),
			User.role.OBVIUS,
		);
	}
}

//the regex is giving that route an id to resolve some of the parameter requirements
function resolveParams(route) {
	return route.replace(/:([A-Za-z_]+)/g, '1');
}

function findRoutesJson() {
	const candidates = [
		path.resolve(__dirname, 'routes.json'),
		path.resolve(__dirname, '..', 'routes.json'),
		path.resolve(__dirname, '..', '..', 'routes.json'),
		path.resolve(__dirname, '..', '..', '..', 'routes.json'),
		path.resolve(process.cwd(), 'routes.json'),
	];

	for (const p of candidates) {
		if (fs.existsSync(p)) return p;
	}

	throw new Error(
		'routes.json not found. Tried:\n' +
		candidates.map((c) => `  - ${c}`).join('\n'),
	);
}

const ROUTES_JSON = findRoutesJson();

function normalizePath(p) {
	if (typeof p !== 'string') return null;
	let s = p.trim();
	if (!s) return null;
	if (!s.startsWith('/')) s = '/' + s;
	if (s.length > 1) s = s.replace(/\/+$/, '');
	return s;
}

function escapeForEgrepLiteral(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Convert a full API path from routes.json into the router-local path
 * we expect to find inside src/server/routes.
 *
 * Examples:
 *  '/api/users/'              -> '/'
 *  '/api/users/:user_id'      -> '/:user_id'
 *  '/api/groups/edit'         -> '/edit'
 *  '/api/logs/info'           -> '/info'
 *  '/api/readings/line/raw/meter/:meter_id' -> '/line/raw/meter/:meter_id'
 */
function apiToRouterLocal(apiPath) {
	const s = normalizePath(apiPath);
	if (!s) return null;

	const parts = s.split('/').filter(Boolean); // ['api','users',':user_id']
	if (parts.length >= 2 && parts[0] === 'api') {
		const rest = parts.slice(2); // drop 'api' + resource segment
		return '/' + rest.join('/');
	}

	// If it doesn't start with /api, treat as already local
	return s;
}


//Load expected routes from routes.json 
 
function loadExpectedLocalPaths() {
	if (!fs.existsSync(ROUTES_JSON)) {
		throw new Error(`routes.json not found at: ${ROUTES_JSON}`);
	}
	const raw = fs.readFileSync(ROUTES_JSON, 'utf8');
	const doc = JSON.parse(raw);
	const expected = new Set();
	for (const group of Object.values(doc)) {
		if (!group || typeof group !== 'object') continue;

		for (const routes of Object.values(group)) {
			if (!Array.isArray(routes)) continue;

			for (const r of routes) {
				const local = apiToRouterLocal(r);
				if (local !== null) expected.add(local);
			}
		}
	}
	return expected;
}

/**
 * Grep src/server/routes for routes:
 *   something.get('/path'
 *   something.post('/path'
 *   something.route('/path').get(...)
 *
 * Returns a Set of routes found in code.
 */
function findActualLocalPathsViaGrep() {
	if (!fs.existsSync(ROUTES_DIR)) {
		throw new Error(`routes directory not found at: ${ROUTES_DIR}`);
	}

	const IDENT = '[A-Za-z_$][A-Za-z0-9_$]*';
	const WS = '[[:space:]]*';
	const METHODS = '(get|post|put|patch|delete|all)';

	// Capture the route after .get('...')
	const patternCall =
		`${IDENT}${WS}\\.${WS}${METHODS}${WS}\\(${WS}'([^']+)'`;

	// Capture the route after .route('...')
	const patternRoute =
		`${IDENT}${WS}\\.${WS}route${WS}\\(${WS}'([^']+)'${WS}\\)`;

	//run grep twice and extract captured groups
	const baseArgs = [
		'-R',
		'--line-number',
		'--extended-regexp',
		'--exclude-dir=node_modules',
		'--exclude-dir=dist',
		'--exclude-dir=build'
	];

	function run(pattern) {
		try {
			return execFileSync('grep', [...baseArgs, pattern, ROUTES_DIR], { encoding: 'utf8' });
		} catch (e) {
			// exit code 1 = no matches (not an error for us)
			if (e && typeof e.status === 'number' && e.status === 1) return '';
			throw e;
		}
	}

	const out = run(patternCall) + '\n' + run(patternRoute);
	const found = new Set();
	for (const line of out.split('\n')) {
		const m = line.match(/'([^']+)'/);
		if (!m) continue;
		const p = normalizePath(m[1]);
		if (p) found.add(p);
	}

	return found;
}