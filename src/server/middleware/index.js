/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This file implements middleware components used by other areas of the system.
 * These middlewares are inserted into subrouters (e.g. /api/obvius) and process
 * every request before it hits a final route handler.
 */

const { lowercaseAllParamNames, paramsLookupMixin } = require('./paramsProcessing');

module.exports = {
	lowercaseAllParamNames,
	paramsLookupMixin
};

