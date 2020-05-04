/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

CREATE TABLE IF NOT EXISTS meters (
	id SERIAL PRIMARY KEY,
	name VARCHAR(50) UNIQUE NOT NULL,
	ipAddress VARCHAR(20),
	enabled BOOLEAN NOT NULL,
	displayable BOOLEAN NOT NULL,
	meter_type meter_type NOT NULL,
	identifier TEXT
);
