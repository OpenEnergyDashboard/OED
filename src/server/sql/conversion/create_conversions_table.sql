/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

CREATE TABLE IF NOT EXISTS conversions (
    source_id INTEGER,
    destination_id INTEGER CHECK (source_id != destination_id),
    bidirectional BOOLEAN NOT NULL,
    slope FLOAT,
    intercept FLOAT,
    note TEXT
);