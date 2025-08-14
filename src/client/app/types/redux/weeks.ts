/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Day } from './days';

/**
 * Defines a Week for the weekly conversion patterns.
 * A week consists of a name, a note, and references to the seven days that make up the week.
 */
export interface Week {
	id: number;

	/**
	 * The name of the week
	 */
	name: string;

	/**
	 * An optional note for the week
	 */
	note: string;

	/**
	 * The seven days that make up the week
	 */
	sunday: Day['id'];
	monday: Day['id'];
	tuesday: Day['id'];
	wednesday: Day['id'];
	thursday: Day['id'];
	friday: Day['id'];
	saturday: Day['id'];
}
