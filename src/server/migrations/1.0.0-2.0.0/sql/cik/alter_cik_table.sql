/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Since don't want the values and no foreign keys, drop and recreate cik.
DROP TABLE cik;

CREATE TABLE IF NOT EXISTS cik (
	source_id INTEGER REFERENCES units(id),
	destination_id INTEGER REFERENCES units(id),
	slope FLOAT,
	intercept FLOAT,
	PRIMARY KEY (source_id, destination_id)
);

-- TODO It is important that a redoCik is done after this to recreate cik.
-- MUST ADD THIS TO THE 2.0 MIGRATION.
