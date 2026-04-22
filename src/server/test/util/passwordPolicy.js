const { chai, mocha, app } = require('../common');
const expect = chai.expect;

const { validatePasswordPolicy } = require('../../util/validatePassword');

mocha.describe('Password Policy Validation', () => {

  mocha.it('Rejects short passwords', () => {
    const result = validatePasswordPolicy('short', 'user1', 'user');
    expect(result).to.be.a('string');
  });

  mocha.it('Rejects admin passwords under 14 chars', () => {
    const result = validatePasswordPolicy('shortpassword', 'admin1', 'admin');
    expect(result).to.include('14');
  });

  mocha.it('Rejects passwords containing username', () => {
    const result = validatePasswordPolicy('user1password', 'user1', 'user');
    expect(result).to.include('username');
  });

  mocha.it('Rejects weak passwords (zxcvbn)', () => {
    const result = validatePasswordPolicy('aaaaaaaa', 'user1', 'user');
    expect(result).to.include('weak');
  });

  mocha.it('Accepts strong passwords', () => {
    const result = validatePasswordPolicy('StrongPassphrase123!', 'user1', 'user');
    expect(result).to.equal(null);
  });

});

const chaiHttp = require('chai-http');
chai.use(chaiHttp);

mocha.describe('User Creation Password Policy', () => {

  let adminToken;

mocha.before(async () => {
  const res = await chai.request(app)
    .post('/api/login')
    .send({
      username: 'test@example.invalid',
      password: 'password'
    });

  adminToken = res.body.token; 
});

  mocha.it('Rejects weak password on create', async () => {
    const res = await chai.request(app)
      .post('/api/users/create')
      .set('token', adminToken)
      .send({
        username: 'testuser',
        password: 'password',
        role: 'user',
        note: 'test'
      });

    expect(res).to.have.status(400);
  });
});