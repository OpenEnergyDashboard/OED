/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

UPDATE units
	SET name = ${name},
		identifier = ${identifier},
		unit_represent = ${unitRepresent},
		sec_in_rate = ${secInRate},
		type_of_unit = ${typeOfUnit},
		unit_index = ${unitIndex},
		suffix = ${suffix},
		displayable = ${displayable},
		always_display = ${alwaysDisplay},
		note = ${note}
	WHERE id = ${id};
