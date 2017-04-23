/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export default class GraphColors {
	constructor() {
		this.colors = ['LightBlue', 'GoldenRod', 'OrangeRed', 'LightSeaGreen', 'LightSlateGray', 'Black', 'Purple'];
		this.pointer = 0;
	}

	/**
	 * Cycles through the colors, wrapping around the end to the beginning
	 * @returns {string} Color
	 */
	getColor() {
		const color = this.colors[this.pointer];
		this.pointer = (this.pointer + 1) % this.colors.length;
		return color;
	}
}
