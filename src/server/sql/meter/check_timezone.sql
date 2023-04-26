/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

CREATE OR REPLACE FUNCTION check_timezone(
    timezone_name TEXT
)
    RETURNS BOOLEAN
AS $$
BEGIN
    RETURN EXISTS(SELECT * FROM pg_timezone_names WHERE name = timezone_name OR abbrev = timezone_name);
END;
$$ LANGUAGE 'plpgsql';
