// const cron = require('node-cron');
const Meter = require('../models/Meter');
const Reading = require('../models/Reading');
const readMamacData = require('./readMamacData');

/**
 * Pulls new data for all the meters in the database.
 * This assumes that every meter is a MAMAC meter with a valid IP address.
 */
async function updateAllMeters() {
	const time = new Date();
	console.log(`Getting meter data ${time.toISOString()}`); // eslint-disable-line no-console
	try {
		const meters = await Meter.getAll();
		// Do all the network requests in parallel.
		const readingInsertBatches = await Promise.all(meters.filter(m => m.enabled && m.type === Meter.type.MAMAC).map(readMamacData));
		// Flatten the batches (an array of arrays) into a single array.
		const allReadingsToInsert = [].concat(...readingInsertBatches);
		await Reading.insertOrUpdateAll(allReadingsToInsert);
		console.log('Update finished'); // eslint-disable-line no-console
	} catch (err) {
		console.error(err); // eslint-disable-line no-console
	}
}

// // Runs every hour, five minutes after. (ie 23:05, 00:05, ...)
// cron.schedule('0 5 * * * *', () => {
// 	const time = new Date();
// 	console.log(`Getting meter data ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`);
// 	updateAllMeters();
// });

module.exports = updateAllMeters();
