/*
 * Purpose:
 *
 *   Create and maintain the non-time-series cache tables required by the
 *   group continuous aggregates.
 *
 *
 * Background:
 *
 *   TimescaleDB continuous aggregates cannot depend on:
 *
 *       - recursive views
 *       - PL/pgSQL functions
 *       - dynamic table-returning logic
 *
 *   The previous group aggregation workflow depended on:
 *
 *       groups_deep_meters view
 *       get_graphic_unit() function
 *
 *   These objects are replaced with cache tables that are refreshed before
 *   refreshing the group continuous aggregates.
 *
 *
 * Data flow:
 *
 *   groups_immediate_children
 *           |
 *           v
 *   groups_deep_children
 *           |
 *           v
 *   groups_deep_meters_cache
 *           |
 *           v
 *   group_graphic_units_cache
 *           |
 *           v
 *   group_hourly_readings_unit_cagg
 *   group_daily_readings_unit_cagg
 *
 *
 * Refresh:
 *
 *   The following functions should be called before refreshing group
 *   continuous aggregates:
 *
 *       update_groups_deep_meters_cache()
 *       update_group_graphic_units_cache()
 *
 */


/*
 * 1. Cache all group to meter relationships.
 *
 * This replaces the previous groups_deep_meters_cache materialized view.
 *
 * Each row represents a meter that contributes readings to a group,
 * including meters inherited through child groups.
 */

CREATE TABLE IF NOT EXISTS groups_deep_meters_cache (
    group_id INTEGER NOT NULL REFERENCES groups(id),
    meter_id INTEGER NOT NULL REFERENCES meters(id),
    PRIMARY KEY(group_id, meter_id)
);


/*
 * Refresh groups_deep_meters_cache.
 *
 * Uses MERGE so existing rows are preserved and only changes are applied.
 */
CREATE OR REPLACE FUNCTION update_groups_deep_meters_cache()
RETURNS void
AS $$
BEGIN
    MERGE INTO groups_deep_meters_cache target
    USING (
        WITH all_deep_meters(group_id, meter_id) AS (
            SELECT DISTINCT gdc.parent_id AS group_id, gim.meter_id AS meter_id
            FROM groups_immediate_meters gim INNER JOIN 
                 groups_deep_children gdc ON gdc.child_id = gim.group_id
            UNION
            SELECT gim.group_id, gim.meter_id
            FROM groups_immediate_meters gim
        )
        SELECT group_id, meter_id
        FROM all_deep_meters

    ) source ON (target.group_id = source.group_id AND target.meter_id = source.meter_id)
    WHEN NOT MATCHED THEN
        INSERT(group_id, meter_id)
        VALUES(source.group_id, source.meter_id);

    -- since not matched by source is not supported in PostgreSQL.
    DELETE FROM groups_deep_meters_cache target
    WHERE NOT EXISTS (
        WITH all_deep_meters(group_id, meter_id) AS (
            SELECT DISTINCT gdc.parent_id AS group_id, gim.meter_id AS meter_id
            FROM groups_immediate_meters gim INNER JOIN 
                 groups_deep_children gdc ON gdc.child_id = gim.group_id
            UNION
            SELECT gim.group_id, gim.meter_id
            FROM groups_immediate_meters gim
        )
        SELECT 1
        FROM all_deep_meters source
        WHERE source.group_id = target.group_id
          AND source.meter_id = target.meter_id
    );
END;
$$ LANGUAGE plpgsql;

/*
 * 2. Cache compatible graphic units for groups.
 *
 * This replaces get_graphic_unit().
 *
 * Each row represents a graphic unit that can display all meters belonging
 * to the group.
 */
CREATE TABLE IF NOT EXISTS group_graphic_units_cache (
    group_id INTEGER NOT NULL REFERENCES groups(id),
    graphic_unit_id INTEGER NOT NULL REFERENCES units(id),
    PRIMARY KEY(group_id, graphic_unit_id)
);


/*
 * Refresh group graphic unit compatibility.
 *
 * A graphic unit is valid for a group only when every meter unit contained
 * in that group has a conversion path to that graphic unit.
 */
CREATE OR REPLACE FUNCTION update_group_graphic_units_cache()
RETURNS void
AS $$
BEGIN

    MERGE INTO group_graphic_units_cache AS target
    USING (
        WITH group_source_units AS (
            SELECT gdm.group_id, array_agg(DISTINCT m.unit_id) AS source_units
            FROM groups_deep_meters_cache gdm INNER JOIN 
                 meters m ON m.id = gdm.meter_id
            GROUP BY gdm.group_id
        ),
        compatible_units AS (
            SELECT gsu.group_id, c.destination_id AS graphic_unit_id
            FROM group_source_units gsu INNER JOIN 
                 cik c ON c.source_id = ANY(gsu.source_units)
            GROUP BY gsu.group_id, c.destination_id, gsu.source_units
            HAVING array_agg(DISTINCT c.source_id) @> gsu.source_units
        )
        SELECT group_id, graphic_unit_id
        FROM compatible_units
    ) AS source ON ( target.group_id = source.group_id AND target.graphic_unit_id = source.graphic_unit_id)
    WHEN NOT MATCHED THEN
        INSERT (group_id, graphic_unit_id)
        VALUES (source.group_id, source.graphic_unit_id);

    DELETE FROM group_graphic_units_cache target
    WHERE NOT EXISTS (
        WITH group_source_units AS (
            SELECT gdm.group_id, array_agg(DISTINCT m.unit_id) AS source_units
            FROM groups_deep_meters_cache gdm INNER JOIN 
                 meters m ON m.id = gdm.meter_id
            GROUP BY gdm.group_id
        ),
        compatible_units AS (
            SELECT gsu.group_id,   c.destination_id AS graphic_unit_id
            FROM group_source_units gsu INNER JOIN 
                 cik c ON c.source_id = ANY(gsu.source_units)
            GROUP BY gsu.group_id, c.destination_id, gsu.source_units
            HAVING array_agg(DISTINCT c.source_id) @> gsu.source_units
        )
        SELECT 1
        FROM compatible_units source
        WHERE source.group_id = target.group_id
          AND source.graphic_unit_id = target.graphic_unit_id
    );

END;
$$ LANGUAGE plpgsql;

/*
 * Initial population.
 *
 * This allows a fresh installation to immediately support group CAGGs.
 * Subsequent updates should call these functions before refreshing CAGGs.
 */
DO $$
BEGIN
    PERFORM update_groups_deep_meters_cache();
    PERFORM update_group_graphic_units_cache();
END
$$;