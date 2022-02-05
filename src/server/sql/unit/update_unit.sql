/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

UPDATE units
	SET name = ${name},
		identifier = ${identifier},
		unit_type = ${unitType},
		unit_index = ${unitIndex},
		suffix = ${suffix},
		displayable_type = ${displayable},
		is_primary = ${primary},
		note = ${note},
		unit_represent_type = ${unitRepresentType}
	WHERE id = ${id};
