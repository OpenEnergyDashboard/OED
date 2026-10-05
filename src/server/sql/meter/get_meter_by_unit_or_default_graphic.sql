/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

SELECT id, name, unit_id, default_graphic_unit
FROM meters
WHERE unit_id = ${unitId} OR default_graphic_unit = ${unitId};