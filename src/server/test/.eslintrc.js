/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Indicates that files in this folder will be run by mocha and will therefore have mocha global variables.
module.exports = {
	"env": {
		"mocha": true
	},
	"rules" : {
		"import/no-extraneous-dependencies": "off" // There are unit test dependencies in this directory (like chai).
	}
};
