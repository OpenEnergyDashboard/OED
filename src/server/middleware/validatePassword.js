const { CSVPipelineError } = require('../services/csvPipeline/CustomErrors');
const failure = require('../services/csvPipeline/failure');

// STUB, TODO: Validate Password
async function validatePassword(req, res, next) {
	try {
		const { password } = req.body;
		if (password === 'password') {
			next();
		} else {
			throw new CSVPipelineError('Failed to supply valid password. Request to upload a csv file is rejected.');
		}
	} catch (error) {
		failure(req, res, error);
	}
};

module.exports = validatePassword;