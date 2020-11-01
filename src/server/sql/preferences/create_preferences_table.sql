/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- create preferences table
CREATE TABLE IF NOT EXISTS preferences (
	id SERIAL PRIMARY KEY,
	display_title VARCHAR(50) NOT NULL,
	default_chart_to_render graph_type NOT NULL,
	default_bar_stacking BOOLEAN NOT NULL,
	default_language language_type NOT NULL
	--Question for steve: We add the column here for timezone as well but it will only work for developers
	-- who are createing a new database. Old devlopers who already have the table need the alter command.
	-- for now I am using the alter command as this will work for all developers. Which command do you want me to use?
);
-- Another column for default timezone added
ALTER TABLE preferences ADD COLUMN default_timezone VARCHAR(10);