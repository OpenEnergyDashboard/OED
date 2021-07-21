/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file exports Schema Classes to be used in the validation stage of the CSV Pipeline. */

class Param {
	/**
	 * @param {string} paramName - The name of the parameter.
	 * @param {string} description - The description of what the parameter needs to be.
	 */
	constructor(paramName, description) {
		this.field = paramName;
		this.description = description;
		this.id = `csv.validation.error.${paramName}`
		this.message = function (provided) {
			return `Provided value ${this.field}=${provided} is invalid. ${this.description}`
		}
	}
}

class EnumParam extends Param {
	/**
	 * @param {string} paramName - The name of the parameter
	 * @param {array} enums - The array of values to check against. enums.length must be greater or equal to one.
	 */
	constructor(paramName, enums) {
		super(paramName, `${paramName} can ${enums.length > 1 ? 'be one of' : 'be'} ${enums.toString()}.`);
		this.enum = enums;
	}
}
class BooleanParam extends EnumParam {
	/**
	 * @param {string} paramName - The name of the parameter.
	 */
	constructor(paramName) {
		super(paramName, ['true', 'false']);
	}
}

class StringParam extends Param {
	/**
	 * 
	 * @param {string} paramName - The name of the parameter.
	 * @param {string} pattern - Regular expression pattern to be used in validation. This can be undefined to avoid checking.
	 * @param {string} description - The description of what the parameter needs to be.
	 */
	constructor(paramName, pattern, description) {
		super(paramName, description);
		this.pattern = pattern;
		this.type = 'string';
	}
}

module.exports = {
	Param,
	EnumParam,
	BooleanParam,
	StringParam
}