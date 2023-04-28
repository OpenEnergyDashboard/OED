/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

CREATE TABLE IF NOT EXISTS groups (
	id SERIAL PRIMARY KEY NOT NULL,
	name VARCHAR(50) UNIQUE NOT NULL CHECK (char_length(name) >= 1),
	displayable BOOLEAN,
	gps POINT DEFAULT NULL,
	note TEXT,
	area REAL NOT NULL DEFAULT 0 CHECK (area >= 0),
	default_graphic_unit INTEGER REFERENCES units(id),
	area_unit area_unit_type NOT NULL DEFAULT 'none'
);

/*
  The groups_immediate_children table holds the edges of the DAG.
  It ensures that no group points to itself (DAGs don't have self-references).

  TODO: Ensure that no cycles are inserted into the graph. This will likely require a BEFORE INSERT trigger.
 */
CREATE TABLE IF NOT EXISTS groups_immediate_children (
	parent_id INT NOT NULL REFERENCES groups (id),
	child_id  INT NOT NULL REFERENCES groups (id),
	PRIMARY KEY (parent_id, child_id), -- Only one edge between a parent and a child
	CHECK (parent_id != child_id) -- No self-references
);

/*
  The groups_deep_children view provides a logical table with a row for each (parent, deep child) relationship in the tree.
 */
CREATE OR REPLACE VIEW groups_deep_children AS
	/* This recursive common table expression (CTE) starts at each no-e in the graph and iterates.
      At each iteration, it adds new rows to the result set for each newly discovered deep child relationship.
  */
	WITH RECURSIVE deep_children(parent_id, child_id) AS (
		SELECT
			gic.parent_id,
			gic.child_id
		FROM groups_immediate_children gic
		UNION ALL -- We can use UNION ALL instead of union because the graph is acyclic and therefore we don't risk looping forever.
		SELECT
			gdc.parent_id,
			gic.child_id
		FROM deep_children gdc
			INNER JOIN groups_immediate_children gic ON gdc.child_id = gic.parent_id
	)
	SELECT -- Select the results of the CTE to create the view.
		parent_id,
		child_id
	FROM deep_children;

/*
  When we aggregate the meters for a group, we need to exclude a meter if we also include a meter that covers a superset
  of its energy readings. We store this information about meters in a series of trees, represented by this table of
  parent-child edges. The set of all of these edges actually forms a MultiTree (https://en.wikipedia.org/wiki/Multitree)

  TODO: Ensure that the graph structure is actually a multitree. This will probably require a BEFORE INSERT trigger.
*/
CREATE TABLE IF NOT EXISTS meters_immediate_children (
	parent_id INT NOT NULL REFERENCES meters (id),
	child_id  INT NOT NULL REFERENCES meters (id),
	PRIMARY KEY (parent_id, child_id),
	CHECK (parent_id != child_id)
);

/*
  Similarly to groups_deep_children, meters_deep_children provides all of the (parent, deep_child) relationships in the
  multitree of meter relationships.
 */
CREATE OR REPLACE VIEW meters_deep_children AS
	/*
    This is implemented the same way that decks_deep_children is implemented.
   */
	WITH RECURSIVE deep_children(parent_id, child_id) AS (
		SELECT
			mic.parent_id,
			mic.child_id
		FROM meters_immediate_children mic
		UNION ALL
		SELECT
			mdc.parent_id,
			mic.child_id
		FROM deep_children mdc
			INNER JOIN meters_immediate_children mic ON mdc.child_id = mic.parent_id
	)
	SELECT
		parent_id,
		child_id
	FROM deep_children;


/*
  This table represents the many-to-many relationship between groups and meters.
*/
CREATE TABLE IF NOT EXISTS groups_immediate_meters (
	group_id INT NOT NULL REFERENCES groups (id),
	meter_id INT NOT NULL REFERENCES meters (id),
	PRIMARY KEY (group_id, meter_id)
);

/*
  This view has a row for each (group, deep child meter) relationship represented by the groups DAG.
  It also includes a boolean column, is_shadowed, that is true when that group has another meter that monitors a superset
  of the energy readings of the meter in that row. When using this view to calculate energy usage for groups, we should
  exclude meters with is_shadowed = True to refrain from double-counting energy readings.

  TODO: Deal with parent meters that are installed after their children. They only shadow them from a start-date onwards.
  The above to-do is probably going to require a significant reworking of some stuff.
 */
CREATE OR REPLACE VIEW groups_deep_meters AS
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

CREATE OR REPLACE FUNCTION check_cyclic_groups()
	RETURNS TRIGGER AS
	$$
		DECLARE
			num_rows INTEGER;
		BEGIN
			SELECT COUNT(*) INTO num_rows
			FROM groups_deep_children WHERE child_id = NEW.parent_id AND parent_id = NEW.child_id;

			IF num_rows > 0 THEN
				RAISE EXCEPTION 'Cyclic group detected';
			END IF;
			RETURN NEW;
		END;
	$$
	LANGUAGE 'plpgsql';

-- This will avoid trying to create the trigger if it exists as that causes an error. This is an issue since
-- the OED install stops the creation of database items after this.
DO
$$
BEGIN
IF NOT EXISTS(SELECT *
	FROM information_schema.triggers
	WHERE event_object_table = 'groups_immediate_children'
	AND trigger_name = 'check_cyclic_groups_trigger'
	)
	THEN
	CREATE TRIGGER check_cyclic_groups_trigger
	BEFORE INSERT OR UPDATE
	ON groups_immediate_children
	FOR EACH ROW
	EXECUTE PROCEDURE check_cyclic_groups();                                                         
 
    END IF ;

END;
$$
