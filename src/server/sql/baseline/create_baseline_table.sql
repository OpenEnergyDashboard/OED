/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
-- Allows us to use gist in this database
CREATE EXTENSION IF NOT EXISTS btree_gist;
-- create baseline table
CREATE TABLE baseline (
	meter_id INT NOT NULL REFERENCES meters (id),
	apply_range tsrange NOT NULL,
	calc_range tsrange NOT NULL,
	baseline_value DOUBLE PRECISION NOT NULL,
	note TEXT,
	PRIMARY KEY (meter_id, apply_range),
	EXCLUDE USING GIST (
		meter_id WITH =,
		apply_range WITH &&
	)
);
