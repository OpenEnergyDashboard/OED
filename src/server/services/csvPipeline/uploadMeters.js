const { CSVPipelineError } = require('../csvPipeline/CustomErrors');
const fs = require('fs').promises;
const { log } = require('../../log');
const Meter = require('../../models/Meter');
const readCsv = require('../pipeline-in-progress/readCsv');
const success = require('../csvPipeline/success');

async function uploadMeters(req, res, filepath, conn) {
    try {
        const { name, ipAddress, enabled, displayable, type, identifier } = await async function () {
            const row = (await readCsv(filepath))[0];
            const meterHash = {
                name: row[0],
                ipAddress: row[1],
                enabled: row[2] === 'TRUE',
                displayable: row[3] === 'TRUE',
                type: row[4],
                identifier: row[5]
            };
            return meterHash;
        }(); // TODO: There are various points of failure for when extracting meter data that we need to think about.
        // TODO: gzip validation and makes filesize smaller
        const newMeter = new Meter(undefined, name, ipAddress, enabled, displayable, type, identifier);
        await newMeter.insert(conn);
        fs.unlink(filepath)
            .catch(err => {
                log.error(`Failed to remove the file ${filepath}.`, err);
            }); // remove file
        success(req, res, `Successfully inserted the meter ${name}.`);
        return;
    } catch (error) {
        throw new CSVPipelineError(`Failed to upload meters due to internal OED Error: ${error.message}`);
    }
}

module.exports = uploadMeters;