const chai = require('chai');
const chaiHttp = require('chai-http');
const bcrypt = require('bcryptjs');
const app = require('../../app'); 
const User = require('../../models/User');
const { getDB } = require('../../models/database');

const expect = chai.expect;
chai.use(chaiHttp);

let adminToken; // Store the admin's login token

// Runs once before all tests
before(async () => {
    // Connect to the test database using environment variables
  const conn = getDB({
    user: process.env.OED_DB_TEST_USER,
    password: process.env.OED_DB_TEST_PASSWORD,
    database: process.env.OED_DB_TEST_DATABASE,
    host: process.env.OED_DB_TEST_HOST,
    port: process.env.OED_DB_TEST_PORT,
  });
    // Define test admin credentials
  const password = 'testpass';
  const username = 'adminTest';

    // Create a test admin user and insert into DB
  const admin = new User(undefined, username, await bcrypt.hash(password, 10), User.role.ADMIN);
  await admin.insert(conn);
  admin.password = password;
   
    // Log in the test admin and extract their token
  const login = await chai.request(app)
    .post('/api/login')
    .send({ username: admin.username, password });

  adminToken = login.body.token;
});
// Admin CRUD tests for conversions
describe('Conversions API', () => {
  it('should allow ADMIN to add a conversion', async () => {
    const res = await chai.request(app)
      .post('/api/conversions/addConversion')
      .set('token', adminToken)
      .send({
        sourceId: 1,
        destinationId: 2,
        bidirectional: true,
        slope: 1.2,
        intercept: 0.5,
        note: 'Test conversion'
      });
    expect(res).to.have.status(200);
  });

  it('should allow ADMIN to edit a conversion', async () => {
    const res = await chai.request(app)
      .post('/api/conversions/edit')
      .set('token', adminToken)
      .send({
        sourceId: 1,
        destinationId: 2,
        slope: 1.4,
        intercept: 0.6,
        bidirectional: false,
        note: 'Edited test'
      });
    expect(res).to.have.status(200);
  });

  it('should allow ADMIN to delete a conversion', async () => {
    const res = await chai.request(app)
      .post('/api/conversions/delete')
      .set('token', adminToken)
      .send({
        sourceId: 1,
        destinationId: 2
      });
    expect(res).to.have.status(200);
  });

  it('should allow ADMIN to get conversions', async () => {
    const res = await chai.request(app)
      .get('/api/conversions')
      .set('token', adminToken);
    expect(res).to.have.status(200);
    expect(res.body).to.be.an('array');
  });
});



