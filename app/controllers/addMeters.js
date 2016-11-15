let parseXML = require('./parseXML');

function insertMeters() {
	return Promise.all(
		parseXML.allMeters()
			// TODO: use a pg-promise task here (maybe?)
			.map(promise => promise.then(meter => meter.insert()))
	);
}

insertMeters()
	.then(() => console.log("Done inserting!"))
	.catch(err => console.error(err));
