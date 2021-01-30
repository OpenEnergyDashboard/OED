/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { CSVPipelineError } = require('../services/csvPipeline/CustomErrors');

// STUB, TODO: Validate password
async function validatePassword(password){
	try {
		return password === 'password';
	} catch (error) {
		const { message } = error;
		throw new CSVPipelineError('Internal OED error. Failed to validate password.', message);
	}
}
module.exports = validatePassword;