/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

--Drop the old primary key (it only includes two columns)
ALTER TABLE cik DROP CONSTRAINT cik_pkey;

--Add the new columns with appropriate infinity defaults
ALTER TABLE cik
    ADD COLUMN start_time TIMESTAMP DEFAULT '-infinity',
    ADD COLUMN end_time TIMESTAMP DEFAULT 'infinity';

--Add the new composite primary key (now includes start_time)
ALTER TABLE cik
    ADD PRIMARY KEY (source_id, destination_id, start_time);