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
		if (this.startTimestamp === undefined && this.endTimestamp === undefined) {
			return 'all';
		}
		// If only start is defined (bounded left)
		if (this.startTimestamp !== undefined && this.endTimestamp === undefined) {
			return `${this.startTimestamp.format()}_`;
		}
		// If only end is defined (bounded right)
		if (this.startTimestamp === undefined && this.endTimestamp !== undefined) {
			return `_${this.endTimestamp.format()}`;
		}
		// Both defined (fully bounded)
		return `${this.startTimestamp.format()}_${this.endTimestamp.format()}`;
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
	getIsLeftBounded() {
		return this.startTimestamp !== undefined && this.endTimestamp === undefined;
	}
	getIsRightBounded() {
		return this.startTimestamp === undefined && this.endTimestamp !== undefined;
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
