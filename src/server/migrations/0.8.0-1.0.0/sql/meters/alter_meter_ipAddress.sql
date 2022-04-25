/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

ALTER TABLE meters
ALTER COLUMN ipAddress TYPE VARCHAR(400);

ALTER TABLE meters
RENAME COLUMN ipAddress TO url;
