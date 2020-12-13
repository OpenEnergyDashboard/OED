/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

type Mode = "meter" | "reading";
type TimeSortDirection = "increasing" | "decreasing";

type Options = {
	createMeter?: boolean;
	cumulative?: boolean;
	duplications?: number;
	timeSort?: TimeSortDirection;
	update?: boolean;
}
// csv shape after parsing rows? and types and column names
// create csv data matrix
// insert readings into database
// OR insert meter data into database (what is the structure of the meters csv file?
// just one row?)
class CanonicalCsv {
	mode: Mode;
	meter: string;
	length: number;
	createMeter = true;
	cumulative = false; // This is the current default; we leave it out of the constructor/options for now.
	duplications = 1;
	timeSort: TimeSortDirection = 'increasing';
	update = false;

	constructor(mode: Mode, meter: string, length: number, options?: Options) {
		// Pre-checks
		if (mode === 'reading' && !meter) {
			throw Error('Invalid. Cannot submit a meter reading without a meter name.');
		}
		if (options) {
			const { createMeter = true, duplications = 1, timeSort = 'increasing', update = false } = options;
			this.createMeter = createMeter;
			this.duplications = duplications;
			this.timeSort = timeSort;
			this.update = update;
		}

		this.mode = mode;
		this.meter = meter;
		this.length = length;
	}
}
