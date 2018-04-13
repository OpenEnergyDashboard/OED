/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 CREATE TABLE IF NOT EXISTS obvius_logs (
	 id SERIAL PRIMARY KEY,
	 filename TEXT NOT NULL,
	 created TIMESTAMP NOT NULL,
	 hash CHARACTER(32) NOT NULL,
	 contents TEXT NOT NULL,
	 processed BOOLEAN NOT NULL
 )