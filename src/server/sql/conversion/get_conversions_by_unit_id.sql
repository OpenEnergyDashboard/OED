/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

SELECT source_id, destination_id, bidirectional
FROM conversions
WHERE source_id = ${unitId} OR destination_id = ${unitId};