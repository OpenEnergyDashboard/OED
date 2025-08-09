/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const moment = require('moment');

class TimeInterval {
	constructor(startTimestamp, endTimestamp) {
		// utc keeps the moments from changing timezone.
		this.startTimestamp = startTimestamp && moment.utc(startTimestamp);
		this.endTimestamp = endTimestamp && moment.utc(endTimestamp);
		this.isBounded = (this.startTimestamp !== undefined) && (this.endTimestamp !== undefined);
	}

	toString() {
		let str = '';
		if (this.startTimestamp === undefined && this.endTimestamp === undefined) {
			str = 'all';
		} else {
			// If startTimestamp is defined, append it to the string.(Left bound)
			if (this.startTimestamp !== undefined) {
				str += this.startTimestamp.format();
			}
			// The middle separator is an underscore.
			str += '_';
			// If endTimestamp is defined, append it to the string.(Right bound)
			if (this.endTimestamp !== undefined) {
				str += this.endTimestamp.format();
			}
		}
		return str;
	}

	equals(other) {
		return (other instanceof TimeInterval) && this.toString() === other.toString();
	}

	/**
	 * Returns the duration of the time interval
	 * @param specifier - Optional parameter, defaults to milliseconds
	 * @returns {number}
	 */
	duration(specifier) {
		if (specifier) {
			return this.endTimestamp.diff(this.startTimestamp, specifier);
		}
		return this.endTimestamp.diff(this.startTimestamp);
	}

	/**
	 * Test if this time interval is contains another.
	 * Intervals are considered to contain equal intervals.
	 * @param other
	 * @returns {boolean}
	 */
	contains(other) {
		if (!(other instanceof TimeInterval)) {
			throw new Error('TimeInterval objects can only be compared to other TimeInterval objects');
		}
		/* The logic here is:
		 *
		 * THIS starts at -∞ OR not after OTHER
		 * AND
		 * THIS ends at +∞ OR not before OTHER
		 */
		return (
			((this.startTimestamp === undefined) || (this.startTimestamp <= other.startTimestamp))
			&&
			((this.endTimestamp === undefined) || (this.endTimestamp >= other.endTimestamp))
		);
	}

	/**
	 * Returns TimeInterval.toString() so that using a time interval as an object key will
	 * have reasonable behaviour.
	 * @returns {*}
	 */
	valueOf() {
		return this.toString();
	}

	getStartTimestamp() {
		return this.startTimestamp;
	}

	getEndTimestamp() {
		return this.endTimestamp;
	}

	getIsBounded() {
		return this.isBounded;
	}
	/**
	 * Check if the time interval is half bounded, meaning it has either a start or an end timestamp, but not both or none.
	 * @returns {boolean}
	 */
	getIsHalfBounded() {
    return (
        (this.startTimestamp !== undefined && this.endTimestamp === undefined) ||
        (this.startTimestamp === undefined && this.endTimestamp !== undefined)
    );
}
	/**
	 * Creates a new unbounded time interval
	 * @returns {TimeInterval}
	 */
	static unbounded() {
		return new TimeInterval(undefined, undefined);
	}

	/**
	 * Creates a new TimeInterval from its string representation
	 * @param {string} stringified the string representation
	 * @returns {TimeInterval}
	 */
	static fromString(stringified) {
		if (stringified === 'all') {
			return TimeInterval.unbounded();
		}
		const [start, end] = stringified.split('_');
		const startTimestamp = start ? moment(start) : undefined;
		const endTimestamp = end ? moment(end) : undefined;
		return new TimeInterval(startTimestamp, endTimestamp);
	}
}

module.exports = { TimeInterval };
