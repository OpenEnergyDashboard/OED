/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

-- Place all distinct source/destination in cik_vary into cik.
-- TODO The slope/intercept should go away so using -999 for now.
-- It should never be used in time varying code so safe.
-- TODO This might be better as a view or maybe a Hypertable (unsure since
-- it does not vary with time.)
INSERT INTO cik (source_id, destination_id, slope, intercept)
select distinct source_id, destination_id, -999, -999 from cik_vary
