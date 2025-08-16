/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// export interface BaselineDataById extends Record<number, Baseline> { }  <-- don't know yet if needed

export interface Baseline {
	baselineValue: number;
	meterId: number;
    isActive: boolean;  // whether there's a baseline applied or not
	note: string;
}
