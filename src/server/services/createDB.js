/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { createSchema } = require('../models/database');
const { log } = require('../log');
const { getConnection } = require('../db');
const Unit = require('../models/Unit');
const Conversion = require('../models/Conversion');
const { redoCik } = require('../services/graph/redoCik');

(async function createSchemaWrapper() {
	const conn = getConnection();
	try {
		await createSchema(conn);
		await Unit.insertStandardUnits(conn);
		await Conversion.insertStandardConversions(conn);
		await redoCik(conn);
		log.info('Schema created', null, true);
		process.exitCode = 0;
	} catch (err) {
		log.error(`Error creating schema: ${err}`, err, skipMail = true);
		process.exitCode = 1;
	}
}());

