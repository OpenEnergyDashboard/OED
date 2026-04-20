/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

CREATE TABLE IF NOT EXISTS holiday_group_members (
	holiday_instance_group_id INTEGER NOT NULL REFERENCES holiday_instance_group(id),
	holiday_instance_id INTEGER NOT NULL REFERENCES holiday_instance(id),
	PRIMARY KEY (holiday_instance_group_id, holiday_instance_id)
);
