var csvToDB = require('../app/controllers/csvToDB');
var duplicate_data ={meter_id: '123', reading: '42', timestamp: '2016-07-10 00:00:00'};

csvToDB.upsertData(duplicate_data, function(){
	//nothing to do here
});
