/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const moment = require('moment');

class TimeInterval {
	constructor(startTimestamp, endTimestamp) {
		this.startTimestamp = startTimestamp && moment(startTimestamp);
		this.endTimestamp = endTimestamp && moment(endTimestamp);
		this.isBounded = this.startTimestamp && this.endTimestamp;
	}

	toString() {
		if (this.isBounded) {
			return `${this.startTimestamp.format()} - ${this.endTimestamp.format()}`;
		}
		return 'all';
	}

	valueOf() {
		return this.toString();
	}

	/**
	 * Creates a new unbounded time interval
	 * @return {TimeInterval}
	 */
	static unbounded() {
		return new TimeInterval(null, null);
	}

	/**
	 * Creates a new TimeInterval from its string representation
	 * @param {string} stringified the string representation
	 * @return {TimeInterval}
	 */
	static fromString(stringified) {
		if (stringified === 'all') {
			return TimeInterval.unbounded();
		}
		const [startTimestamp, endTimestamp] = stringified.split('-').map(timestamp => moment(parseInt(timestamp)));
		return new TimeInterval(startTimestamp, endTimestamp);
	}
}

module.exports = TimeInterval;
