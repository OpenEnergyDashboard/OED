/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { createSchema } = require('../models/database');
const { log } = require('../log');
const { getConnection } = require('../db');
const { insertStandardUnits, insertStandardConversions } = require('../util/insertData');
const { redoCik } = require('../services/graph/redoCik');

(async function createSchemaWrapper() {
	const conn = getConnection();
	try {
		try {
			await createSchema(conn);
		} catch(err) {
			log.error('create schema error', err);
		}
		try {
			await insertStandardUnits(conn);
		} catch(err) {
			log.error('insert standart units failed', err);
		}
		try {
			await insertStandardConversions(conn);
		} catch (err) {
			log.error('insertconversions failed', err);
		}
		try {
		await redoCik(conn);
		} catch(err) {
			log.error('error redo cik', err);
		}
		log.info('Schema created', null, true);
		process.exitCode = 0;
	} catch (err) {
		log.error(`Error creating schema: ${err}`, err, skipMail = true);
		process.exitCode = 1;
	}
}());

