/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Creates a new VERSION object, which contains a major, minor, and patch release level.
 * OED is compliant with Semver.
 */

const pkgJson = require('../../package.json');

function OEDVersion() {
	const versionParts = pkgJson.version.split('.');
	if (versionParts.length !== 3) {
		// Cannot use log module as we do not want the server config included on the client
		console.error('package.json version string is not in semver x.y.z format'); // eslint-disable-line no-console
	}
	this.major = versionParts[0];
	this.minor = versionParts[1];
	this.patch = versionParts[2];
}

/**
 * @returns {string} a string representation of the Semver version of the application,
 * in the form v1.2.3
 */
OEDVersion.prototype.toString = function toString() {
	return `v${this.major}.${this.minor}.${this.patch}`;
};

const VERSION = new OEDVersion();
module.exports = VERSION;
