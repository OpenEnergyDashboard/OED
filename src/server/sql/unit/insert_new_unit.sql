/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

INSERT INTO units(name, identifier, unit_represent, sec_in_rate, type_of_unit, suffix, displayable, preferred_display, note, min_val, max_val, disable_checks)
VALUES (${name}, ${identifier}, ${unitRepresent}, ${secInRate}, ${typeOfUnit}, ${suffix}, ${displayable}, ${preferredDisplay}, ${note}, ${minVal}, ${maxVal}, ${disableChecks})
RETURNING id;
