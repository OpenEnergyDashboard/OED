/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

CREATE TABLE IF NOT EXISTS holidays (
	id SERIAL PRIMARY KEY NOT NULL,
	name VARCHAR(50) NOT NULL CHECK (char_length(name) >= 1),
	start_date DATE NOT NULL,
	location TEXT NOT NULL CHECK (char_length(location) >= 1),
	note TEXT,
	UNIQUE (name, location, start_date)
);
