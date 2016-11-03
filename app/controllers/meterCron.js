 var cron = require('node-cron');
 var csvToDB = require('./csvToDB');

 // Runs every hour, five minutes after. (ie 23:05, 00:05, ...)
 cron.schedule('* 5 0-23 * * *', function(){
	 var time = new Date;
	 console.log("getting meter data " + time.getHours() + ":" +time.getMinutes() + ":" + time.getSeconds());
	 csvToDB.pollMeters();
 });
