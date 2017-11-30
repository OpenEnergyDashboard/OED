/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = {
	"env": {
		"browser": true
	},
	"rules": {
		"no-console": 1,
		"max-len": ["warn", {"code": 200, "tabWidth": 4, "ignoreStrings": true}],
		"react/jsx-indent-props": [1 , 'tab']
	}
};
