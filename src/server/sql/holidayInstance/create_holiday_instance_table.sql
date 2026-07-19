/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

CREATE TABLE IF NOT EXISTS holiday_instance (
	id SERIAL PRIMARY KEY NOT NULL,
	name VARCHAR(50) UNIQUE NOT NULL CHECK (char_length(name) >= 1),
	note TEXT,
	holiday_id INTEGER NOT NULL REFERENCES holidays(id),
	day_pattern_id INTEGER NOT NULL REFERENCES day_patterns(id),
	UNIQUE (holiday_id, day_pattern_id)
);
