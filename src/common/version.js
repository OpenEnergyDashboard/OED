/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Creates a new VERSION object, which contains a major, minor, and patch release level.
 * OED is compliant with Semver.
 */
function OEDVersion() {
	this.major = 0;
	this.minor = 1;
	this.patch = 0;
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
