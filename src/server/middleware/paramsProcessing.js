/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This file implements middlewares used to preprocess requests, aggregating and modifying
 * the parameters sent by the user agent.
 */


/**
 * A middleware to lowercase all params, including those passed by form/multipart
 */
function lowercaseAllParamNames(req, res, next) {
	for (const key of Object.entries(req.query)) {
		req.query[key[0].toLowerCase()] = key[1];
	}
	for (const key of Object.entries(req.params)) {
		req.params[key[0].toLowerCase()] = key[1];
	}
	if (req.body) {
		for (const key of Object.entries(req.body)) {
			req.body[key[0].toLowerCase()] = key[1];
		}
	}
	next();
}

/**
 * A middleware to add a mixin which consists of a single a function,
 * req.param, which when combined with the above code allows all types of
 * parameters (GET query parameters)
 */
function paramsLookupMixin(req, res, next) {
	// Mixin for getting parameters from any possible method.
	req.param = (param, defaultValue) => {
		param = param.toLowerCase();
		// If the param exists as a route param, use it.
		if (typeof req.params[param] !== 'undefined') {
			return req.params[param];
		}
		// If the param exists as a body param, use it.
		if (req.body && typeof req.body[param] !== 'undefined') {
			return req.body[param];
		}
		// Return the query param, if it exists.
		if (typeof req.query[param] !== 'undefined') {
			return req.query[param];
		}
		// Return the default value if all else fails.
		return defaultValue;
	};

	next();
}

module.exports = {
	lowercaseAllParamNames,
	paramsLookupMixin
}

