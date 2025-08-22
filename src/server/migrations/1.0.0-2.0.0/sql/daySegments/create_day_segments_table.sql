/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
-- To duplicate, you must create new day_patterns records.
-- Reusing existing ones isn't safe due to the ON DELETE CASCADE constraint on day_id
CREATE TABLE IF NOT EXISTS day_segments (
	id SERIAL PRIMARY KEY,
	day_id INTEGER NOT NULL REFERENCES day_patterns(id) ON DELETE CASCADE,
	start_hour INTEGER NOT NULL CHECK (start_hour >= 0 and start_hour <= 23),
	end_hour INTEGER NOT NULL CHECK (end_hour > 0 and end_hour <= 24),
	slope FLOAT NOT NULL,
	intercept FLOAT NOT NULL,
	note TEXT,
	CHECK (start_hour < end_hour),
	UNIQUE (day_id, start_hour, end_hour)
);