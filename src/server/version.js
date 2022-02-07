/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const pkgJson = require('../../package.json');
const { log } = require('./log');

/**
 * Creates a new OEDVersion object, which contains a major, minor, and patch release level.
 * OED is compliant with Semver. The version data is fetched from the package.json.
 */
function OEDVersion() {
	const versionParts = pkgJson.version.split('.');
	if (versionParts.length !== 3) {
		log.error(`package.json version string "${pkgJson.version}" is not in semver x.y.z format`);
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
