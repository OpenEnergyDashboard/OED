/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

INSERT INTO units(name, identifier, unit_represent, sec_in_rate, type_of_unit, suffix, displayable, preferred_display, note, max_val, min_val)
VALUES (${name}, ${identifier}, ${unitRepresent}, ${secInRate}, ${typeOfUnit}, ${suffix}, ${displayable}, ${preferredDisplay}, ${note}, ${maxVal}, ${minVal})
RETURNING id;
