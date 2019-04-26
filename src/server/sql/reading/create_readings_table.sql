/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Create a readings table that has attributes of meter_id, reading, start and end timestamps and a composite key of
-- meter_id and start_timestamp.
CREATE TABLE IF NOT EXISTS readings (
  meter_id INT NOT NULL REFERENCES meters(id),
  reading REAL NOT NULL,
  start_timestamp TIMESTAMP NOT NULL,
	end_timestamp TIMESTAMP NOT NULL,
	CHECK (start_timestamp < readings.end_timestamp),
  PRIMARY KEY (meter_id, start_timestamp)
);
