const chai = require('chai');
const chaiHttp = require('chai-http');
const bcrypt = require('bcryptjs');
const app = require('../../app');
const User = require('../../models/User');
const { getDB } = require('../../models/database');

const expect = chai.expect;
chai.use(chaiHttp);

let adminToken;

before(async () => {
    const conn = getDB({
      user: process.env.OED_DB_TEST_USER,
      password: process.env.OED_DB_TEST_PASSWORD,
      database: process.env.OED_DB_TEST_DATABASE,
      host: process.env.OED_DB_TEST_HOST,
      port: process.env.OED_DB_TEST_PORT,
    });
  
    const password = 'testpass';
    const username = 'adminConversionArray';
  
    const admin = new User(undefined, username, await bcrypt.hash(password, 10), User.role.ADMIN);
    admin.password = password;
  
    // 🔥 Always delete existing user first
    await conn.query('DELETE FROM users WHERE username = $1', [username]);
    await admin.insert(conn);
  
    const login = await chai.request(app)
      .post('/api/login')
      .send({ username: admin.username, password });
  
    adminToken = login.body.token;
  });
  

  describe('Conversion Array API - Admin Access', () => {
    it('should allow ADMIN to refresh reading views only', async function () {
      this.timeout(20000); // ⏱ Extend timeout to 20s
      const res = await chai.request(app)
        .post('/api/conversion-array/refresh') // <-- corrected route
        .set('token', adminToken)
        .send({ refreshReadingViews: true });
      expect(res).to.have.status(200);
    });
  
    it('should allow ADMIN to redo CIK only', async function () {
      this.timeout(10000); // safe buffer for CIK operation
      const res = await chai.request(app)
        .post('/api/conversion-array/refresh') // <-- corrected route
        .set('token', adminToken)
        .send({ redoCik: true });
      expect(res).to.have.status(200);
    });
  
    it('should allow ADMIN to do both CIK and reading refresh', async function () {
      this.timeout(25000); // ⏱ This can take a while, so extend to 25s
      const res = await chai.request(app)
        .post('/api/conversion-array/refresh') // <-- corrected route
        .set('token', adminToken)
        .send({ redoCik: true, refreshReadingViews: true });
      expect(res).to.have.status(200);
    });
  });
  
