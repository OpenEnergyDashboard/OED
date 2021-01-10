const { CSVPipelineError } = require('../csvPipeline/CustomErrors');
const fs = require('fs').promises;
const { log } = require('../../log');
const Meter = require('../../models/Meter');
const readCsv = require('../pipeline-in-progress/readCsv');
const success = require('../csvPipeline/success');

async function uploadMeters(req, res, filepath, conn) {
	try {
		const temp = (await readCsv(filepath)).map(row => (
			{
				name: row[0],
				ipAddress: row[1],
				enabled: row[2] === 'TRUE',
				displayable: row[3] === 'TRUE',
				type: row[4],
				identifier: row[5]
			}
		)); // TODO: Loop over the Meters Class fields instead
		const meters = (req.body.headerrow === 'true') ? temp.slice(1) : temp;
		log.info("metersddddddddddd" + meters)
		console.log('headerrow ' + req.body.headerrow + meters);
		// TODO: gzip validation and makes filesize smaller
		await Promise.all(meters.map(meter => {
			return (new Meter(undefined, meter.name, meter.ipAddress, meter.enabled, meter.displayable, meter.type, meter.identifier)).insert(conn);
		}));
		fs.unlink(filepath)
			.catch(err => {
				log.error(`Failed to remove the file ${filepath}.`, err);
			}); // remove file
		success(req, res, `Successfully inserted the meters.`);
		return;
	} catch (error) {
		throw new CSVPipelineError(`Failed to upload meters due to internal OED Error: ${error.message}`);
	}
}

module.exports = uploadMeters;