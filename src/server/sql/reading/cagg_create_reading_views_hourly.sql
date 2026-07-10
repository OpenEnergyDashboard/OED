/*
 * This script continues the work introduced in PR#1546, which established the
 * benchmark for migrating hourly meter reading queries from PostgreSQL
 * materialized views to TimescaleDB hypertables and continuous aggregates.
 *
 * Only the database objects required from PR#1546 were carried forward and
 * adapted to integrate TimescaleDB continuous aggregates with the existing
 * hourly meter reading workflow in the timeVary branch.
 *
 * Overview:
 *
 *   readings
 *       |
 *       |  (trigger: insert/update/delete)
 *       v
 *   hypertable_hourly_split
 *       |
 *       |  (continuous aggregate)
 *       v
 *   meter_hourly_readings_unit_cagg
 *
 *
 * The original meter_hourly_readings_unit materialized view splits readings
 * that span multiple hours into hourly intervals. Since TimescaleDB continuous
 * aggregates operate on stored rows, the hourly splitting is performed first
 * and persisted in hypertable_hourly_split.
 *
 * The cik_vary conversion values (slope, intercept, and destination unit) are
 * applied and stored during the split process. This avoids runtime joins to
 * cik_vary when querying the continuous aggregate and preserves the correct
 * time-varying conversion that applied when the reading occurred.
 *
 * hypertable_hourly_split stores normalized hourly slices. The continuous
 * aggregate built on top of it provides pre-computed aggregation results,
 * similar to a PostgreSQL materialized view, while allowing TimescaleDB to
 * incrementally refresh only affected time ranges.
 *
 * Purpose:
 *
 *   Compare query performance and behavior between:
 *
 *     1. Existing PostgreSQL materialized views
 *     2. TimescaleDB continuous aggregates
 *
 *   The goal is to determine whether migrating the timeVary branch reporting
 *   workload to TimescaleDB provides measurable performance benefits.
 *
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
LANGUAGE plpgsql
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

    INSERT INTO hypertable_hourly_split
	(
		meter_id,
		reading,
		start_timestamp,
		end_timestamp,
		unit_represent,
		sec_in_rate,
		slope,
		intercept,
		graphic_unit_id
	)
	/*
	 * Expand the reading into hourly intervals and apply the appropriate
	 * unit conversion metadata.
	 */
	SELECT
		NEW.meter_id,
		CASE
			WHEN u.unit_represent = 'quantity'::unit_represent_type THEN

				(
					NEW.reading * 3600 /
					extract(
						EPOCH FROM
						(NEW.end_timestamp - NEW.start_timestamp)
					)
				)
				*
				extract(
					EPOCH FROM
					(
						least(
							NEW.end_timestamp,
							gen.interval_start + INTERVAL '1 hour'
						)
						-
						greatest(
							NEW.start_timestamp,
							gen.interval_start
						)
					)
				)

			WHEN u.unit_represent IN
				(
					'flow'::unit_represent_type,
					'raw'::unit_represent_type
				) THEN

				(
					NEW.reading * 3600 / u.sec_in_rate
				)
				*
				extract(
					EPOCH FROM
					(
						least(
							NEW.end_timestamp,
							gen.interval_start + INTERVAL '1 hour'
						)
						-
						greatest(
							NEW.start_timestamp,
							gen.interval_start
						)
					)
				)

		END AS reading,

		/*
		 * Clamp each generated interval to the actual overlap between the
		 * reading and the hourly bucket.
		 */
		greatest(
			NEW.start_timestamp,
			gen.interval_start
		) AS start_timestamp,

		least(
			NEW.end_timestamp,
			gen.interval_start + INTERVAL '1 hour'
		) AS end_timestamp,

		u.unit_represent,
		u.sec_in_rate,
		c.slope,
		c.intercept,
		c.destination_id AS graphic_unit_id

	FROM meters m
		
	INNER JOIN units u
		ON m.unit_id = u.id

	INNER JOIN cik_vary c
		ON c.source_id = m.unit_id
	   AND tsrange(c.start_time, c.end_time, '()')
		   &&
		   tsrange(NEW.start_timestamp, NEW.end_timestamp, '[]')

	/*
	 * Split readings spanning multiple hours into one row per hour.
	 */
	CROSS JOIN LATERAL generate_series(
		date_trunc('hour', NEW.start_timestamp),
		date_trunc_up('hour', NEW.end_timestamp) - INTERVAL '1 hour',
		INTERVAL '1 hour'
	) gen(interval_start)

	WHERE m.id = NEW.meter_id;

    RETURN NEW;

END;
$$;

/*
 * 5. Recreate the readings trigger.
 *
 * PostgreSQL does not support CREATE TRIGGER IF NOT EXISTS, so the existing
 * trigger is removed first to make this script safe to rerun during development
 * and deployment.
 */
DROP TRIGGER IF EXISTS trg_readings_update_hourly_hypertable
ON readings;


/*
 * 6. Create trigger to maintain hypertable_hourly_split.
 *
 * The trigger fires after changes are committed to readings so the trigger
 * function can query the updated source row when generating hourly slices.
 *
 * Events:
 *
 *   INSERT:
 *       Creates hourly split records for the new reading.
 *
 *   UPDATE:
 *       Refreshes hourly split records for the modified reading.
 *
 *   DELETE:
 *       Removes hourly split records generated from the deleted reading.
 */
CREATE TRIGGER trg_readings_update_hourly_hypertable
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
LANGUAGE plpgsql
AS $$
BEGIN
	DELETE FROM hypertable_hourly_split;

	INSERT INTO hypertable_hourly_split
	(
		meter_id,
		reading,
		start_timestamp,
		end_timestamp,
		unit_represent,
		sec_in_rate,
		slope,
		intercept,
		graphic_unit_id
	)
	SELECT
		r.meter_id,
		CASE
			WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
				(
					r.reading * 3600 /
					extract(
						EPOCH FROM
						(r.end_timestamp - r.start_timestamp)
					)
				)
				*
				extract(
					EPOCH FROM
					(
						least(
							r.end_timestamp,
							gen.interval_start + INTERVAL '1 hour'
						)
						-
						greatest(
							r.start_timestamp,
							gen.interval_start
						)
					)
				)

			WHEN u.unit_represent IN
				(
					'flow'::unit_represent_type,
					'raw'::unit_represent_type
				) THEN
				(
					r.reading * 3600 / u.sec_in_rate
				)
				*
				extract(
					EPOCH FROM
					(
						least(
							r.end_timestamp,
							gen.interval_start + INTERVAL '1 hour'
						)
						-
						greatest(
							r.start_timestamp,
							gen.interval_start
						)
					)
				)
		END AS reading,
		greatest(
			r.start_timestamp,
			gen.interval_start
		) AS start_timestamp,
		least(
			r.end_timestamp,
			gen.interval_start + INTERVAL '1 hour'
		) AS end_timestamp,
		u.unit_represent,
		u.sec_in_rate,
		c.slope,
		c.intercept,
		c.destination_id AS graphic_unit_id

	FROM readings r

	INNER JOIN meters m
		ON r.meter_id = m.id

	INNER JOIN units u
		ON m.unit_id = u.id

	INNER JOIN cik_vary c
		ON c.source_id = m.unit_id
	   AND tsrange(c.start_time, c.end_time, '()')
		   &&
		   tsrange(r.start_timestamp, r.end_timestamp, '[]')

	CROSS JOIN LATERAL generate_series(
		date_trunc('hour', r.start_timestamp),
		date_trunc_up('hour', r.end_timestamp) - INTERVAL '1 hour',
		INTERVAL '1 hour'
	) gen(interval_start);
END;
$$;


/*
 * 7. Create continuous aggregate for hourly meter readings.
 *
 * This continuous aggregate replaces the existing
 * meter_hourly_readings_unit materialized view using TimescaleDB's
 * incremental aggregation engine.
 *
 * Data flow:
 *
 *   hypertable_hourly_split
 *           |
 *           v
 *   meter_hourly_readings_unit_cagg
 *
 *
 * The hourly split table already contains:
 *
 *   - hourly overlap calculations
 *   - cik_vary conversion parameters
 *   - unit metadata
 *
 * Therefore, the continuous aggregate does not need to join against
 * cik_vary or other lookup tables during query execution.
 *
 *
 * Reading calculation:
 *
 * hypertable_hourly_split stores reading contributions scaled by the
 * duration overlap within each hourly slice.
 *
 * To calculate the final hourly reading rate:
 *
 *   1. Convert the stored contribution back into a rate.
 *   2. Apply the cik_vary conversion:
 *
 *          converted_value = rate * slope + intercept
 *
 *   3. Weight the converted rate by the duration of the slice.
 *   4. Divide by the total duration to produce the weighted average.
 *
 * This reproduces the calculation performed by the original
 * meter_hourly_readings_unit materialized view.
 */
DROP MATERIALIZED VIEW IF EXISTS meter_hourly_readings_unit_cagg;

CREATE MATERIALIZED VIEW meter_hourly_readings_unit_cagg
WITH (timescaledb.continuous) 
AS
SELECT
    meter_id,
    graphic_unit_id,

    /*
     * Group hourly slices into TimescaleDB continuous aggregate buckets.
     */
    time_bucket(
        '1 hour',
        start_timestamp
    ) AS bucket,


    /*
     * Weighted average reading rate with cik_vary conversion applied.
     *
     * Each slice contributes based on its duration within the hour.
     */
    sum(
        (
            reading
            /
            extract(
                EPOCH FROM (end_timestamp - start_timestamp)
            )
            * slope
            + intercept
        )
        *
        extract(
            EPOCH FROM (end_timestamp - start_timestamp)
        )
    )
    /
    sum(
        extract(
            EPOCH FROM (end_timestamp - start_timestamp)
        )
    ) AS reading_rate,


    /*
     * Maximum converted reading rate observed within the hour.
     */
    max(
        reading
        /
        extract(
            EPOCH FROM (end_timestamp - start_timestamp)
        )
        * slope
        + intercept
    ) AS max_rate,


    /*
     * Minimum converted reading rate observed within the hour.
     */
    min(
        reading
        /
        extract(
            EPOCH FROM (end_timestamp - start_timestamp)
        )
        * slope
        + intercept
    ) AS min_rate,


    /*
     * Unit metadata is preserved so consumers can interpret the aggregate
     * values correctly.
     */
    unit_represent,
    sec_in_rate


FROM hypertable_hourly_split


GROUP BY
    meter_id,
    graphic_unit_id,
    time_bucket('1 hour', start_timestamp),
    unit_represent,
    sec_in_rate
WITH NO DATA;

ALTER MATERIALIZED VIEW meter_hourly_readings_unit_cagg
SET (
    timescaledb.materialized_only = false
);
