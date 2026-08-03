/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

--create logmsg table
CREATE TABLE IF NOT EXISTS logmsg (
	id SERIAL PRIMARY KEY,
	log_type log_msg_type NOT NULL,
	log_message TEXT NOT NULL,
	log_time TIMESTAMP NOT NULL
);

-- Log retrieval filters by type and a time range, orders by time, and applies
-- a limit. Keep that path index-backed as the append-only log table grows.
CREATE INDEX IF NOT EXISTS logmsg_time_type_idx
ON logmsg (log_time, log_type);
