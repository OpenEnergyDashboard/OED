/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
DELETE FROM groups_immediate_children
WHERE parent_id = ${parent_id} AND child_id = ${child_id};
