/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

CREATE TABLE IF NOT EXISTS maps (
	id SERIAL PRIMARY KEY,
	name VARCHAR(50) UNIQUE NOT NULL,
	displayable boolean NOT NULL,
	note VARCHAR(500),
	filename VARCHAR(200) NOT NULL,
	modified_date TIMESTAMP NOT NULL,
	origin POINT DEFAULT NULL,
	opposite POINT DEFAULT NULL,
	map_source TEXT NOT NULL,
	north_angle FLOAT(8)
);
