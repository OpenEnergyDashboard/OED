const { CSVPipelineError } = require('../csvPipeline/CustomErrors');
const fs = require('fs').promises;
const { log } = require('../../log');
const Meter = require('../../models/Meter');
const readCsv = require('../pipeline-in-progress/readCsv');
const success = require('../csvPipeline/success');

async function uploadMeters(req, res, filepath, conn) {
	try {
		const columns = Object.keys(new Meter()).slice(1); // used for the shape of the csv
		const temp = (await readCsv(filepath)).map(row => {
			const hash = {};
			columns.forEach((entry, idx) => {
				hash[entry] = row[idx];
			});
			return hash;
		});
		const meters = (req.body.headerrow === 'true') ? temp.slice(1) : temp;
		await Promise.all(meters.map(meter => {
			return (new Meter(undefined, meter.name, meter.ipAddress, meter.enabled === 'TRUE', meter.displayable === 'TRUE', meter.type, meter.identifier)).insert(conn);
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