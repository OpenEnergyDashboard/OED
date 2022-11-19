/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- This shifts the supplied meter name's readings to the current time in the the provided timezone or UTC if not provided.
-- It was designed to allow developers to shift meter readings to the current time so compare will work.
select shift_readings(${meter_name}, ${timezone});
