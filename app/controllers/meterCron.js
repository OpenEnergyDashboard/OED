const cron = require('node-cron');
const Meter = require('./../../models/Meter');
const Reading = require('./../../models/Reading');
const readMamacData = require('./readMamacData');

/**
 * Pulls new data for all the meters in the database.
 * This assumes that every meter is a MAMAC meter with a valid IP address.
 */
function updateAllMeters() {
	Meter.getAll()
		.then(meters =>
				meters.map(meter =>
					readMamacData(meter).then(Reading.insertOrUpdateAll)
				)
		)
		.then(promises => Promise.all(promises))
		.then(() => console.log('Update finished'))
		.catch(console.error);
}

// Runs every hour, five minutes after. (ie 23:05, 00:05, ...)
cron.schedule('0 5 * * * *', () => {
	const time = new Date();
	console.log(`getting meter data ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`);
	updateAllMeters();
});
