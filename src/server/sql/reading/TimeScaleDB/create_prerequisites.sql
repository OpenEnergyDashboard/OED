/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
 /*
 * Prefrace:
 * 	 This script continues the work introduced in PR#1546, which established the
 * 	 benchmark for migrating hourly meter reading queries from PostgreSQL
 * 	 materialized views to TimescaleDB hypertables and continuous aggregates.
 *
 * 	 Only the database objects required from PR#1546 were carried forward and
 * 	 adapted to integrate TimescaleDB continuous aggregates with the existing
 * 	 hourly meter reading workflow in the timeVary branch.
 *
 * Purpose:
 *
 *   Create the TimescaleDB infrastructure required by the hourly and daily
 *   continuous aggregates.
 *
 * This script creates:
 *
 *   1. hypertable_hourly_split
 *   2. TimescaleDB hypertable
 *   3. Supporting indexes
 *   4. Trigger function to maintain the hypertable
 *   5. Trigger on readings
 *   6. Rebuild function
 *
 * Data flow:
 *
 *   readings
 *       │
 *       ▼
 *   hypertable_hourly_split
 *
 * Notes:
 *
 *   - This script does not create any continuous aggregates.
 *   - The trigger maintains the hypertable as readings are inserted,
 *     updated, or deleted.
 *   - The rebuild function allows the hypertable to be regenerated from
 *     readings when required (for example after rebuilding cik_vary).
 */

 /*
 * 1. Create hypertable_hourly_split.
 *
 * Stores readings after they have been split into hourly intervals.
 * A single row in readings may produce multiple rows in this table when the
 * reading crosses one or more hour boundaries.
 *
 * Conversion information from cik_vary is stored with each hourly slice so
 * downstream aggregation does not need to join back to cik_vary.
 *
 * Columns:
 *
 *   reading:
 *       Reading contribution scaled by the overlap duration within this hour.
 *
 *   slope/intercept/graphic_unit_id:
 *       Conversion parameters required to convert the reading into the target
 *       graphic unit that was valid at the time of the reading.
 *
 *   unit_represent/sec_in_rate:
 *       Original unit metadata required to correctly aggregate quantity, flow,
 *       and raw readings.
 */
CREATE TABLE IF NOT EXISTS hypertable_hourly_split (
    meter_id INTEGER NOT NULL,
    reading FLOAT NOT NULL,
    start_timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    end_timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    unit_represent unit_represent_type NOT NULL,
    sec_in_rate FLOAT NOT NULL,
    slope FLOAT NOT NULL,
    intercept FLOAT NOT NULL,
    graphic_unit_id INTEGER NOT NULL
);

-- All four aggregates use materialized_only=false, meaning queries can reach unmaterialized split rows.
CREATE INDEX IF NOT EXISTS hypertable_hourly_split_meter_graphic_time_idx
ON hypertable_hourly_split
    (meter_id, graphic_unit_id, start_timestamp DESC);

-- row trigger searches cik_vary by source_id and an overlapping time range
CREATE INDEX IF NOT EXISTS cik_vary_source_time_idx
ON cik_vary (source_id, start_time, end_time);


/*
 * 2. Convert hypertable_hourly_split into a TimescaleDB hypertable.
 *
 * start_timestamp is used as the time dimension because hourly slices are
 * primarily queried and aggregated by time range.
 */
SELECT create_hypertable(
    'hypertable_hourly_split',
     by_range('start_timestamp'),
    if_not_exists => TRUE
);


/*
 * 3. Enforce uniqueness of hourly slices.
 *
 * The unique index prevents duplicate hourly slices for the same meter and
 * time range and supports efficient maintenance operations.
 * This index also improves lookup performance when synchronizing changed
 * readings.
 */
CREATE UNIQUE INDEX IF NOT EXISTS hypertable_hourly_split_meter_time_idx
ON hypertable_hourly_split
(
    meter_id,
    start_timestamp,
    end_timestamp,
    graphic_unit_id,
    slope,
    intercept
);


/*
 * 4. Maintain hypertable_hourly_split from changes in readings.
 *
 * This trigger function maintains only the hourly slices associated with the
 * reading affected by the trigger event.
 *
 * INSERT:
 *     Generate hourly slices for the new reading.
 *
 * UPDATE:
 *     Recalculate hourly slices for the updated reading.
 *
 * DELETE:
 *     Remove hourly slices generated from the deleted reading.
 */
CREATE OR REPLACE FUNCTION update_hourly_hypertable()
RETURNS trigger
AS $$
BEGIN

    /*
     * DELETE removes all hourly slices generated from the deleted reading.
     */
    IF TG_OP = 'DELETE' THEN

        DELETE FROM hypertable_hourly_split
        WHERE meter_id = OLD.meter_id
          AND start_timestamp >= OLD.start_timestamp
          AND end_timestamp <= OLD.end_timestamp;

        RETURN OLD;

    END IF;


    /*
     * UPDATE may change the reading duration or hour boundaries.
     * Remove the hourly slices generated from the previous version
     * of the reading before rebuilding them from NEW.
     */
    IF TG_OP = 'UPDATE' THEN

        DELETE FROM hypertable_hourly_split
        WHERE meter_id = OLD.meter_id
          AND start_timestamp >= OLD.start_timestamp
          AND end_timestamp <= OLD.end_timestamp;

    END IF;

    INSERT INTO hypertable_hourly_split(meter_id, reading, start_timestamp, end_timestamp, unit_represent, sec_in_rate, slope, intercept, graphic_unit_id)
	SELECT
		NEW.meter_id,
		CASE
			WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
				(NEW.reading * 3600 / extract(EPOCH FROM (NEW.end_timestamp - NEW.start_timestamp))) * extract(EPOCH FROM (least(NEW.end_timestamp, gen.interval_start + INTERVAL '1 hour') - greatest(NEW.start_timestamp, gen.interval_start)))
			WHEN u.unit_represent IN ('flow'::unit_represent_type, 'raw'::unit_represent_type ) THEN 
				(NEW.reading * 3600 / u.sec_in_rate) * extract(EPOCH FROM(least(NEW.end_timestamp, gen.interval_start + INTERVAL '1 hour') - greatest(NEW.start_timestamp,gen.interval_start))
		) END AS reading,
		greatest(NEW.start_timestamp, gen.interval_start) AS start_timestamp,
		least(NEW.end_timestamp, gen.interval_start + INTERVAL '1 hour') AS end_timestamp,
		u.unit_represent,
		u.sec_in_rate,
		c.slope,
		c.intercept,
		c.destination_id AS graphic_unit_id
	FROM meters m INNER JOIN 
		 units u ON m.unit_id = u.id INNER JOIN 
		 cik_vary c ON c.source_id = m.unit_id AND /*tsrange(c.start_time, c.end_time, '()') && tsrange(NEW.start_timestamp, NEW.end_timestamp, '[]')*/
		 c.start_time < NEW.end_timestamp AND c.end_time > NEW.start_timestamp CROSS JOIN 
		 LATERAL generate_series(date_trunc('hour', NEW.start_timestamp), date_trunc_up('hour', NEW.end_timestamp) - INTERVAL '1 hour', INTERVAL '1 hour') gen(interval_start)
	WHERE m.id = NEW.meter_id;
    RETURN NEW;

END;
$$ LANGUAGE plpgsql;

/*
 * 5. Recreate the readings trigger.
 *
 * PostgreSQL does not support CREATE TRIGGER IF NOT EXISTS, so the existing
 * trigger is removed first to make this script safe to rerun during development
 * and deployment.
 */
DROP TRIGGER IF EXISTS trigger_readings_update_hourly_hypertable
ON readings;


/*
 * 6. Create trigger to maintain hypertable_hourly_split.
 *
 * The trigger fires after changes are committed to readings so the trigger
 * function can query the updated source row when generating hourly slices.
 *
 * This trigger maintains the source data used by TimescaleDB continuous
 * aggregates.
 *
 * TimescaleDB continuous aggregates do not refresh immediately from this
 * trigger. They track affected time ranges through invalidation and are
 * refreshed separately using:
 *
 *     refresh_continuous_aggregate()
 *
 *     or a continuous aggregate refresh policy.
 *
 * Events:
 *
 *   INSERT:
 *       Creates hourly split records for the new reading.
 *
 *   UPDATE:
 *       Removes old hourly split records and recreates them from the
 *       modified reading.
 *
 *   DELETE:
 *       Removes hourly split records generated from the deleted reading.
 */
CREATE TRIGGER trigger_readings_update_hourly_hypertable
AFTER INSERT OR UPDATE OR DELETE
ON readings
FOR EACH ROW
EXECUTE FUNCTION update_hourly_hypertable();


/*
 * Rebuild hypertable_hourly_split from the current readings and cik_vary rows.
 *
 * This is needed after cik_vary is regenerated because the trigger stores the
 * conversion metadata that exists at reading insert time. If readings were
 * inserted before redoCikVary ran, or if conversion segments changed, the split
 * rows must be rebuilt from the current conversion table before the continuous
 * aggregate is refreshed.
 */
CREATE OR REPLACE FUNCTION rebuild_hourly_hypertable_split()
RETURNS void
AS $$
BEGIN
	DELETE FROM hypertable_hourly_split;

	INSERT INTO hypertable_hourly_split(meter_id, reading, start_timestamp, end_timestamp, unit_represent, sec_in_rate, slope, intercept, graphic_unit_id)
	SELECT
		r.meter_id,
		CASE
			WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
				(r.reading * 3600 / extract(EPOCH FROM(r.end_timestamp - r.start_timestamp))) * extract(EPOCH FROM (least(r.end_timestamp, gen.interval_start + INTERVAL '1 hour') - greatest(r.start_timestamp, gen.interval_start)))
			WHEN u.unit_represent IN('flow'::unit_represent_type, 'raw'::unit_represent_type) THEN 
				(r.reading * 3600 / u.sec_in_rate) * extract(EPOCH FROM(least(r.end_timestamp, gen.interval_start + INTERVAL '1 hour') - greatest(r.start_timestamp, gen.interval_start))) 
		END AS reading,
		greatest(r.start_timestamp, gen.interval_start) AS start_timestamp,
		least(r.end_timestamp, gen.interval_start + INTERVAL '1 hour') AS end_timestamp,
		u.unit_represent,
		u.sec_in_rate,
		c.slope,
		c.intercept,
		c.destination_id AS graphic_unit_id
	FROM readings r INNER JOIN 
		 meters m ON r.meter_id = m.id INNER JOIN 
		 units u ON m.unit_id = u.id INNER JOIN 
		 cik_vary c ON c.source_id = m.unit_id AND /*tsrange(c.start_time, c.end_time, '()') && tsrange(r.start_timestamp, r.end_timestamp, '[]')*/ 
		 c.start_time < r.end_timestamp AND c.end_time > r.start_timestamp CROSS JOIN 
		 LATERAL generate_series(date_trunc('hour', r.start_timestamp), date_trunc_up('hour', r.end_timestamp) - INTERVAL '1 hour', INTERVAL '1 hour') gen(interval_start);
END;
$$ LANGUAGE plpgsql;