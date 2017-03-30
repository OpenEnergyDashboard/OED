/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const moment = require('moment');

// This patches momentjs objects to work with pg-promise.
// See https://github.com/vitaly-t/pg-promise#custom-type-formatting
moment.fn.formatDBType = function formatDBType() {
	return this.toDate();
};
