/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

SELECT id, name, identifier, unitType, unitIndex, suffix, displayable, primary, note
FROM units 
WHERE unitType = unit_type.meter
AND identifier = ${unitIndex};