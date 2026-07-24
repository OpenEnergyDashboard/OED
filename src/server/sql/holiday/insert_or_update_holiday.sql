/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

INSERT INTO holidays (
  name,
  start_date,
  location,
  type,
  note
) VALUES (
  ${name},
  ${startDate},
  ${location},
  ${type},
  ${note}
)
ON CONFLICT (name, location, start_date)
  DO UPDATE SET
    type = EXCLUDED.type,
    note = COALESCE(EXCLUDED.note, holidays.note);
