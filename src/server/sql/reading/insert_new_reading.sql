/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

INSERT INTO readings (meter_id, reading, start_timestamp, end_timestamp)
VALUES (${meterID}, ${reading}, ${startTimestamp}, ${endTimestamp});
