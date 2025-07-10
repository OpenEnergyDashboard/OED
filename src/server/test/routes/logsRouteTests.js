const { chai, mocha, expect, app, testUser } = require('../common');
const moment = require('moment');

mocha.describe('Log Routes', () => {
   let token;

   mocha.before(async () => {
       // Login to get authentication token
       const res = await chai.request(app).post('/api/login')
           .send({ username: testUser.username, password: testUser.password });
       token = res.body.token;
   });

   // Original status code tests
   mocha.describe('Basic API validation', () => {
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

   // Enhanced insert-and-verify tests
   mocha.describe('Insert and verify log functionality', () => {
       mocha.it('should insert INFO log and retrieve it correctly', async () => {
           const testMessage = 'Test INFO message for retrieval';
           
           // Insert log via API
           const insertResponse = await chai.request(app)
               .post('/api/logs/info')
               .set('token', token)
               .send({ message: testMessage });
           expect(insertResponse.status).to.equal(200);

           // Retrieve and verify the log appears in results
           const retrieveResponse = await chai.request(app)
               .get('/api/logs/logsmsg/getLogsByDateRangeAndType')
               .set('token', token)
               .query({ 
                   timeInterval: moment().subtract(1, 'minute').toISOString(),
                   logTypes: 'INFO',
                   logLimit: '100'
               });
           
           expect(retrieveResponse.status).to.equal(200);
           expect(retrieveResponse.body).to.be.an('array');
           
           // Find our test message in the results
           const testLog = retrieveResponse.body.find(log => log.logMessage === testMessage);
           expect(testLog).to.not.be.undefined;
           expect(testLog.logType).to.equal('INFO');
           expect(testLog.logMessage).to.equal(testMessage);
       });

       mocha.it('should filter logs by type correctly', async () => {
           const infoMessage = 'Test INFO for filtering';
           const warnMessage = 'Test WARN for filtering';
           const errorMessage = 'Test ERROR for filtering';

           // Insert different types of logs
           await chai.request(app)
               .post('/api/logs/info')
               .set('token', token)
               .send({ message: infoMessage });

           await chai.request(app)
               .post('/api/logs/warn')
               .set('token', token)
               .send({ message: warnMessage });

           await chai.request(app)
               .post('/api/logs/error')
               .set('token', token)
               .send({ message: errorMessage });

           // Query for only INFO logs
           const infoResponse = await chai.request(app)
               .get('/api/logs/logsmsg/getLogsByDateRangeAndType')
               .set('token', token)
               .query({ 
                   timeInterval: moment().subtract(1, 'minute').toISOString(),
                   logTypes: 'INFO',
                   logLimit: '100'
               });

           expect(infoResponse.status).to.equal(200);
           const infoLogs = infoResponse.body.filter(log => 
               log.logMessage === infoMessage || log.logMessage === warnMessage || log.logMessage === errorMessage
           );
           
           // Should only contain INFO log
           expect(infoLogs).to.have.lengthOf(1);
           expect(infoLogs[0].logType).to.equal('INFO');
           expect(infoLogs[0].logMessage).to.equal(infoMessage);

           // Query for only WARN logs
           const warnResponse = await chai.request(app)
               .get('/api/logs/logsmsg/getLogsByDateRangeAndType')
               .set('token', token)
               .query({ 
                   timeInterval: moment().subtract(1, 'minute').toISOString(),
                   logTypes: 'WARN',
                   logLimit: '100'
               });

           expect(warnResponse.status).to.equal(200);
           const warnLogs = warnResponse.body.filter(log => 
               log.logMessage === infoMessage || log.logMessage === warnMessage || log.logMessage === errorMessage
           );
           
           // Should only contain WARN log
           expect(warnLogs).to.have.lengthOf(1);
           expect(warnLogs[0].logType).to.equal('WARN');
           expect(warnLogs[0].logMessage).to.equal(warnMessage);
       });

       mocha.it('should filter logs by multiple types', async () => {
           const infoMessage = 'Test INFO multi-type';
           const warnMessage = 'Test WARN multi-type';
           const errorMessage = 'Test ERROR multi-type';

           // Insert different types of logs
           await chai.request(app)
               .post('/api/logs/info')
               .set('token', token)
               .send({ message: infoMessage });

           await chai.request(app)
               .post('/api/logs/warn')
               .set('token', token)
               .send({ message: warnMessage });

           await chai.request(app)
               .post('/api/logs/error')
               .set('token', token)
               .send({ message: errorMessage });

           // Query for INFO and WARN logs
           const response = await chai.request(app)
               .get('/api/logs/logsmsg/getLogsByDateRangeAndType')
               .set('token', token)
               .query({ 
                   timeInterval: moment().subtract(1, 'minute').toISOString(),
                   logTypes: 'INFO,WARN',
                   logLimit: '100'
               });

           expect(response.status).to.equal(200);
           const testLogs = response.body.filter(log => 
               log.logMessage === infoMessage || log.logMessage === warnMessage || log.logMessage === errorMessage
           );
           
           // Should contain INFO and WARN logs, but not ERROR
           expect(testLogs).to.have.lengthOf(2);
           const logTypes = testLogs.map(log => log.logType).sort();
           expect(logTypes).to.deep.equal(['INFO', 'WARN']);
       });

       mocha.it('should respect log limit parameter', async () => {
           const messagePrefix = 'Limit test message';

           // Insert multiple logs
           for (let i = 0; i < 5; i++) {
               await chai.request(app)
                   .post('/api/logs/info')
                   .set('token', token)
                   .send({ message: `${messagePrefix} ${i}` });
           }

           // Query with limit of 2
           const response = await chai.request(app)
               .get('/api/logs/logsmsg/getLogsByDateRangeAndType')
               .set('token', token)
               .query({ 
                   timeInterval: moment().subtract(1, 'minute').toISOString(),
                   logTypes: 'INFO',
                   logLimit: '2'
               });

           expect(response.status).to.equal(200);
           expect(response.body).to.be.an('array');
           
           // Should not return more than the limit
           expect(response.body.length).to.be.at.most(2);
       });

       mocha.it('should handle date range filtering', async () => {
           const oldMessage = 'Old test message';
           const recentMessage = 'Recent test message';

           // Insert a log
           await chai.request(app)
               .post('/api/logs/info')
               .set('token', token)
               .send({ message: oldMessage });

           // Wait a moment, then insert another
           await new Promise(resolve => setTimeout(resolve, 1000));
           const cutoffTime = moment();
           await new Promise(resolve => setTimeout(resolve, 1000));

           await chai.request(app)
               .post('/api/logs/info')
               .set('token', token)
               .send({ message: recentMessage });

           // Query for logs after the cutoff time
           const response = await chai.request(app)
               .get('/api/logs/logsmsg/getLogsByDateRangeAndType')
               .set('token', token)
               .query({ 
                   timeInterval: cutoffTime.toISOString(),
                   logTypes: 'INFO',
                   logLimit: '100'
               });

           expect(response.status).to.equal(200);
           const testLogs = response.body.filter(log => 
               log.logMessage === oldMessage || log.logMessage === recentMessage
           );

           // Should only contain the recent message
           expect(testLogs).to.have.lengthOf(1);
           expect(testLogs[0].logMessage).to.equal(recentMessage);
       });

       mocha.it('should return empty array when no logs match filters', async () => {
           // Query for logs with a very specific type that doesn't exist
           const response = await chai.request(app)
               .get('/api/logs/logsmsg/getLogsByDateRangeAndType')
               .set('token', token)
               .query({ 
                   timeInterval: moment().add(1, 'day').toISOString(), // Future date
                   logTypes: 'INFO',
                   logLimit: '100'
               });

           expect(response.status).to.equal(200);
           expect(response.body).to.be.an('array');
           expect(response.body).to.have.lengthOf(0);
       });
   });
});