const { CSVPipelineError } = require('../services/csvPipeline/CustomErrors');

// STUB, TODO: Validate password
async function validatePassword(password){
	try {
		return password === 'password';
	} catch (error) {
		const { message } = error;
		throw new CSVPipelineError(`Internal OED error. Failed to validate password. `, message);
	}
}
module.exports = validatePassword;