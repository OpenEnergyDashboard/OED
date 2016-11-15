let parseXML = require('./parseXML');

/**
 * A promise that inserts all meters from ips.xlsx into the database.
 * @returns {Promise.<*>}
 */
function insertMeters() {
	return Promise.all(
		parseXML.allMeters()
			// TODO: use a pg-promise task here (maybe?)
			.map(promise => promise.then(meter => meter.insert()))
	);
}

exports.insertMeters = insertMeters;
/*
insertMeters()
	.then(() => console.log("Done inserting!"))
	.catch(err => console.error(err));
*/