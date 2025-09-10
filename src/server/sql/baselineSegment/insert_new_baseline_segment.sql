/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
INSERT INTO baseline_segments(meter_id, baseline_value, start_time, end_time, calc_start, calc_end, note)
VALUES (${meterId}, ${baselineValue}, ${startTime}, ${endTime}, ${calcStart}, ${calcEnd}, ${note});