const parseXML = require('./parseXML');

/**
 * A promise that inserts all meters from ips.xlsx into the database.
 * @returns {Promise.<*>}
 */
async function insertMeters() {
	const meters = await Promise.all(parseXML.allMeters());
	return await Promise.all(meters.map(m => m.insert()));
}

// (async function insertMetersWrapper() {
// 	try {
// 		await insertMeters();
// 		console.log('Done inserting meters');
// 	} catch (err) {
// 		console.error(err);
// 	}
// }());

exports.insertMeters = insertMeters;
