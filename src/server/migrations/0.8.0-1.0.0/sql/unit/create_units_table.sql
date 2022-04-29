/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

CREATE TABLE IF NOT EXISTS units (
	id SERIAL PRIMARY KEY,
	name VARCHAR(50) UNIQUE NOT NULL CHECK (char_length(name) >= 1),
	identifier VARCHAR(50) UNIQUE NOT NULL CHECK (char_length(identifier) >= 1),
	unit_represent unit_represent_type NOT NULL,
	sec_in_rate INTEGER DEFAULT 3600,
	type_of_unit unit_type NOT NULL,
	unit_index INTEGER, 
	suffix VARCHAR(50) DEFAULT '',
	displayable displayable_type NOT NULL,
	preferred_display BOOLEAN NOT NULL,
	note TEXT,
	UNIQUE (type_of_unit, unit_index)
);