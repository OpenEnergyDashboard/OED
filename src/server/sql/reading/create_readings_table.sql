/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- create readings table
CREATE TABLE IF NOT EXISTS readings (
  meter_id INT NOT NULL REFERENCES meters(id),
  reading FLOAT NOT NULL,
  start_timestamp TIMESTAMP NOT NULL,
	end_timestamp TIMESTAMP NOT NULL,
	CHECK (start_timestamp < readings.end_timestamp),
  PRIMARY KEY (meter_id, start_timestamp)
);
