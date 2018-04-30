/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Configfile = require('../../models/obvius/Configfile');
const stopDB = require('../../models/database').stopDB;
const { log } = require('../../log');

async function showConfigfiles() {
	try {
		const allConfigfiles = await Configfile.getAll();
		let response = '';
		for (f of allConfigfiles) {
			console.log(`Config log for ID ${f.id} (${f.serialId}:${f.modbusId}).`)
			console.log(f.contents)
			console.log('-------------------------\n\n')
		}
	} catch (err) {
		log.error(`Error listing Obvius config logs: ${err}`, err);
	} finally {
		stopDB();
	}
}

showConfigfiles();
