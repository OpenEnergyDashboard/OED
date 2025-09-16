
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
CREATE TABLE IF NOT EXISTS baseline_segments (
	meter_id INTEGER NOT NULL REFERENCES meters(id),
	baseline_value FLOAT,
	start_time TIMESTAMP NOT NULL DEFAULT '-infinity',
	end_time TIMESTAMP NOT NULL DEFAULT 'infinity',
    calc_start TIMESTAMP,
    calc_end TIMESTAMP,
	note TEXT,
	PRIMARY KEY (meter_id, start_time, end_time),
	CHECK (start_time < end_time)
);