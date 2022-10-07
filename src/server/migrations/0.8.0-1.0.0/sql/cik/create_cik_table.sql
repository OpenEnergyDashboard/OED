/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

CREATE TABLE IF NOT EXISTS cik (
	row_index INTEGER,
	column_index INTEGER,
	slope FLOAT,
	intercept FLOAT,
	PRIMARY KEY (row_index, column_index)
);
