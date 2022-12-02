/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

ALTER TABLE meters ADD CONSTRAINT default_timezone_meter CHECK (default_timezone_meter IS NULL OR check_timezone(default_timezone_meter::TEXT) = true);
ALTER TABLE meters ADD CONSTRAINT area CHECK (area >= 0);
ALTER TABLE meters ADD CONSTRAINT reading_duplication CHECK (reading_duplication::INTEGER >= 1 AND reading_duplication::INTEGER <= 9);
ALTER TABLE meters ADD CONSTRAINT time_sort CHECK (time_sort::TEXT = 'increasing' OR time_sort::TEXT = 'decreasing');
