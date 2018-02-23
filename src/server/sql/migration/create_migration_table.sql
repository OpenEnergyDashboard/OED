/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- create migration table
CREATE TABLE IF NOT EXISTS migrations (
	id SERIAL PRIMARY KEY,
	from_version VARCHAR(20) NOT NULL,
	to_version VARCHAR(20) NOT NULL,
	update_timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);
