/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

-- Put each unique source + destination in cik_vary into cik.
INSERT INTO cik (source_id, destination_id)
SELECT DISTINCT source_id, destination_id
FROM cik_vary
;
