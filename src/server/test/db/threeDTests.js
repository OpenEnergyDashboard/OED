const { mocha, expect, testDB } = require('../common');
var Reading = require ("../../models/Reading");

mocha.describe('3D Test Suite', () => {
    let result, conn;
  
    mocha.beforeEach(async () => {
	  conn = testDB.getConnection();
    });
  
    mocha.it('should call the function', async ()  => {  
      result = await Reading.getThreeDReadings(21, 1,'2021-01-01', '2023-01-01', conn);
      console.log(result); // Print the return value
    });

  });
  