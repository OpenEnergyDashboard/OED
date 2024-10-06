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

-- TODO Consider index optimization for queries