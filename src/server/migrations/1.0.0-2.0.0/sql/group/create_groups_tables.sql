/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- The old table was not a view.
-- Unclear if a cascade is needed but it may be so doing since seems okay.
DROP TABLE IF EXISTS groups_deep_meters CASCADE;

/*
  This view has a row for each (group, deep child meter) relationship represented by the groups DAG.
  It also includes a boolean column, is_shadowed, that is true when that group has another meter that monitors a superset
  of the energy readings of the meter in that row. When using this view to calculate energy usage for groups, we should
  exclude meters with is_shadowed = True to refrain from double-counting energy readings.

  TODO: Deal with parent meters that are installed after their children. They only shadow them from a start-date onwards.
  The above to-do is probably going to require a significant reworking of some stuff.
 */
CREATE MATERIALIZED VIEW IF NOT EXISTS groups_deep_meters AS
	/* First we need to get all the deep child meters for each group. We just join groups_immediate_meters to
    groups_deep_children to grab all the meters associated with a group or one of its deep children.
  */

	WITH all_deep_meters(group_id, meter_id) AS (
		SELECT DISTINCT -- Distinct because two children might include the same meter, and we only want it once.
			gdc.parent_id AS group_id,
			gim.meter_id AS meter_id
		FROM groups_immediate_meters gim
			INNER JOIN groups_deep_children gdc ON gdc.child_id = gim.group_id
		UNION
		SELECT
			gim.group_id AS group_id,
			gim.meter_id AS meter_id
		from groups_immediate_meters gim
	)
	SELECT
		adm.group_id AS group_id,
		adm.meter_id AS meter_id,
		EXISTS(
		/*
      We want to mark meter-group relationships as shadowed if there is another relationship with the same
      group that has a meter that is a deep parent of this meter.
      We do this by looking for rows in the meters_deep_children (mdc) view where mdc.child_id is the id
      of the current meter, and mdc.parent_id is the ID of some other row in all_deep_meters that has the same group ID as
      our current group and has a meter id that is a deep parent of our current meter.
    */
				SELECT 1 -- It doesn't matter what the result set has, only that it has at least 1 row, so we can just use '1'.
				FROM all_deep_meters adm2
					INNER JOIN meters_deep_children mdc ON mdc.parent_id = adm2.meter_id AND mdc.child_id = adm.meter_id
				WHERE adm2.group_id = adm.group_id
		)            AS is_shadowed
	FROM all_deep_meters adm;
