/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
 /*
TO DO: can be removed after the next release, when all users have upgraded to a version 
that uses TimescaleDB continuous aggregates instead of PostgreSQL materialized views.
Remove PostgreSQL materialized reading views replaced by TimescaleDB
continuous aggregates. Group views must be dropped before the meter views
they depend on.
 */
DROP MATERIALIZED VIEW IF EXISTS group_daily_readings_unit;
DROP MATERIALIZED VIEW IF EXISTS group_hourly_readings_unit;
DROP MATERIALIZED VIEW IF EXISTS meter_daily_readings_unit;
DROP MATERIALIZED VIEW IF EXISTS meter_hourly_readings_unit;
DROP MATERIALIZED VIEW IF EXISTS groups_deep_meters;
