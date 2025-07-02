const { chai, mocha, expect, app, testUser } = require('../common');


mocha.describe('Log Routes', () => {
   let token;

   mocha.before(async () => {
       // Login to get authentication token
       const res = await chai.request(app).post('/api/login')
           .send({ username: testUser.username, password: testUser.password });
       token = res.body.token;
   });

   mocha.it('should return 200 for valid message', async () => {
       const response = await chai.request(app)
           .post('/api/logs/info')
           .set('token', token)
           .send({ message: 'Valid log message' });
       expect(response.status).to.equal(200);
   });


   mocha.it('should return 400 for invalid message', async () => {
       const response = await chai.request(app)
           .post('/api/logs/info')
           .set('token', token)
           .send({ message: '' }); // Invalid empty message
       expect(response.status).to.equal(400);
   }); 


   mocha.it('should return 200 for valid warning message', async () => {
       const response = await chai.request(app)
           .post('/api/logs/warn')
           .set('token', token)
           .send({ message: 'Valid warning message' });
       expect(response.status).to.equal(200);
   });


   mocha.it('should return 400 for invalid warning message', async () => {
       const response = await chai.request(app)
           .post('/api/logs/warn')
           .set('token', token)
           .send({ message: '' }); // Invalid empty message
       expect(response.status).to.equal(400);
   });


   mocha.it('should return 200 for valid error message', async () => {
       const response = await chai.request(app)
           .post('/api/logs/error')
           .set('token', token)
           .send({ message: 'Valid error message' });
       expect(response.status).to.equal(200);
   });


   mocha.it('should return 400 for invalid error message', async () => {
       const response = await chai.request(app)
           .post('/api/logs/error')
           .set('token', token)
           .send({ message: '' }); // Invalid empty message
       expect(response.status).to.equal(400);
   });


   mocha.it('should return logs for valid date range and type', async () => {
       const response = await chai.request(app)
           .get('/api/logs/logsmsg/getLogsByDateRangeAndType')
           .set('token', token)
           .query({ timeInterval: '2023-01-01T00:00:00Z', logTypes: 'INFO', logLimit: '10' });
       expect(response.status).to.equal(200);
       expect(response.body).to.be.an('array');
   });


   mocha.it('should return 400 for invalid date range and type', async () => {
       const response = await chai.request(app)
           .get('/api/logs/logsmsg/getLogsByDateRangeAndType')
           .set('token', token)
           .query({ timeInterval: 'invalid', logTypes: 'INVALID', logLimit: 'invalid' });
       expect(response.status).to.equal(400);
   });
});

