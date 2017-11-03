/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- create preferences table
CREATE TABLE IF NOT EXISTS preferences (
	user_id INT NOT NULL REFERENCES users(id),
	display_title VARCHAR(50) NOT NULL,
	default_graph_type graph_type NOT NULL DEFAULT 'line',
	default_bar_stacking BOOLEAN NOT NULL DEFAULT FALSE,
	PRIMARY KEY (user_id)
);
