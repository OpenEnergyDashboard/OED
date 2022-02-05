/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

CREATE TABLE IF NOT EXISTS units (
	id SERIAL PRIMARY KEY,
	name VARCHAR(50) UNIQUE NOT NULL,
	identifier VARCHAR(50) UNIQUE NOT NULL,
	unit_type unit_type NOT NULL,
	unit_index INTEGER NOT NULL, 
	suffix VARCHAR(50) DEFAULT '',
	displayable_type displayable_type NOT NULL,
	is_primary BOOLEAN NOT NULL,
	note TEXT,
	unit_represent_type unit_represent_type NOT NULL
);