/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 /**
  * Returns proper string to use for conversion representation of direction
  * @param bidirectional if the conversion is bidirectional (true) or not (false)
  * @returns double-ended arrow if bidirectional or single if not
  */
export function conversionArrow(bidirectional: boolean) {
	// Arrow is bidirectional if conversion is bidirectional and one way if not.
	let arrowShown: string;
	if (bidirectional) {
		arrowShown = ' ↔ ';
	} else {
		arrowShown = ' → ';
	}
	return arrowShown;
}
