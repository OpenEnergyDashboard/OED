/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const mode = {
	status: 'STATUS',
	logfile_upload: 'LOGFILEUPLOAD',
	config_file_manifest: 'CONFIGFILEMANIFEST',
	config_file_upload: 'CONFIGFILEUPLOAD',
	config_file_download: 'CONFIGFILEDOWNLOAD',
	test: 'MODE_TEST'
}

const filename = {
	logfile: 'LOGFILE',
	configfile: 'CONFIGFILE'
}

module.exports = {
	mode,
	filename
}

