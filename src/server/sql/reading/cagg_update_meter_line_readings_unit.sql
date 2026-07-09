/*
 * Function: meter_line_readings_unit
 *
 * Purpose:
 *
 *   Retrieve meter readings optimized for rendering line graphs. This function
 *   determines the most appropriate data resolution (raw, hourly, or daily)
 *   based on the requested time range, meter reading frequency, and configured
 *   point limits.
 *
 *   This function is the unit-aware replacement for compressed_readings_2.
 *   It supports graphic unit conversion and time-varying unit conversions.
 *
 *
 * Data sources:
 *
 *   Raw:
 *       Reads directly from the readings table and applies cik_vary conversion
 *       during query execution.
 *
 *   Hourly:
 *       Uses the TimescaleDB continuous aggregate:
 *
 *           meter_hourly_readings_unit_cagg
 *
 *       The continuous aggregate is built on top of:
 *
 *           hypertable_hourly_split
 *
 *       Hourly splitting and time-varying conversion metadata are applied
 *       before aggregation, avoiding runtime joins to cik_vary.
 *
 *   Daily:
 *       Uses:
 *
 *           meter_daily_readings_unit
 *
 *
 * Parameters:
 *
 *   meter_ids:
 *       Array of meter IDs to retrieve readings for.
 *
 *   passed_graphic_unit_id:
 *       Destination graphic unit ID used for converting readings.
 *
 *   start_stamp:
 *       Beginning timestamp of the requested range.
 *
 *   end_stamp:
 *       Ending timestamp of the requested range.
 *
 *   point_accuracy:
 *       Controls the resolution selection.
 *
 *       Values:
 *
 *           raw     - Return raw readings.
 *           hourly  - Return hourly aggregated readings.
 *           daily   - Return daily aggregated readings.
 *           auto    - Automatically select the best resolution.
 *
 *   max_raw_points:
 *       Maximum raw points allowed when point_accuracy = 'auto'.
 *
 *   max_hour_points:
 *       Maximum hourly points allowed when point_accuracy = 'auto'.
 *
 *
 * Resolution selection:
 *
 *   When point_accuracy = 'auto', the function selects the highest resolution
 *   possible while staying within the requested point limits.
 *
 *   Selection order:
 *
 *       1. Raw readings
 *       2. Hourly continuous aggregate
 *       3. Daily readings
 *
 *
 * Notes:
 *
 *   - Each meter is processed independently because meters may have different
 *     reading frequencies and available data ranges.
 *
 *   - The hourly data path previously queried the PostgreSQL materialized view:
 *
 *         meter_hourly_readings_unit
 *
 *     and now uses the TimescaleDB continuous aggregate:
 *
 *         meter_hourly_readings_unit_cagg
 *
 *   - Design details:
 *
 *                           meter_line_readings_unit
 *                                     |
 *                    +----------------+----------------+
 *                    |                |                |
 *                    v                v                v
 *                readings     hourly continuous     daily view
 *                                 aggregate
 *                                     |
 *                                     v
 *                      meter_hourly_readings_unit_cagg
 */


CREATE OR REPLACE FUNCTION meter_line_readings_unit (
    meter_ids INTEGER[],

    -- Destination graphic unit id.
    passed_graphic_unit_id INTEGER,

    -- Requested data range.
    start_stamp TIMESTAMP,
    end_stamp TIMESTAMP,

    -- Controls raw/hourly/daily selection.
    point_accuracy reading_line_accuracy,

    -- Maximum number of raw points when using auto selection.
    max_raw_points INTEGER,

    -- Maximum number of hourly points when using auto selection.
    max_hour_points INTEGER
)

RETURNS TABLE
(
    meter_id INTEGER,
    reading_rate FLOAT,
    min_rate FLOAT,
    max_rate FLOAT,
    start_timestamp TIMESTAMP,
    end_timestamp TIMESTAMP
)

AS $$

DECLARE

    requested_range TSRANGE;
    requested_interval INTERVAL;
    requested_interval_seconds INTEGER;

    frequency INTERVAL;
    frequency_seconds INTEGER;

    -- Current meter being processed.
    current_meter_index INTEGER := 1;

    -- Current meter id from meter_ids array.
    current_meter_id INTEGER;

    -- Accuracy selected for current meter.
    current_point_accuracy reading_line_accuracy;


BEGIN


    /*
     * Process each meter independently.
     *
     * Each meter may have different:
     *
     *   - Reading frequency.
     *   - Available data range.
     *   - Optimal resolution.
     */
    WHILE current_meter_index <= cardinality(meter_ids)

    LOOP

        current_point_accuracy := point_accuracy;

        current_meter_id := meter_ids[current_meter_index];


        /*
         * Limit requested range to the actual available reading data.
         */
        requested_range :=
            shrink_tsrange_to_real_readings(
                tsrange(start_stamp, end_stamp, '[]'),
                array_append(
                    ARRAY[]::INTEGER[],
                    current_meter_id
                )
            );


        /*
         * Automatically determine resolution when requested.
         */
        IF (current_point_accuracy = 'auto'::reading_line_accuracy)

        THEN

            /*
             * No data exists for this meter.
             * Default to daily because it requires the least data.
             */
            IF (upper(requested_range) = 'infinity')

            THEN

                current_point_accuracy :=
                    'daily'::reading_line_accuracy;


            ELSE

                requested_interval :=
                    upper(requested_range)
                    -
                    lower(requested_range);


                requested_interval_seconds :=
                    (
                        SELECT *
                        FROM EXTRACT(EPOCH FROM requested_interval)
                    );


                SELECT reading_frequency
                INTO frequency
                FROM meters
                WHERE id = current_meter_id;


                frequency_seconds :=
                    (
                        SELECT *
                        FROM EXTRACT(EPOCH FROM frequency)
                    );


                /*
                 * Prefer raw data when the number of points is acceptable.
                 */
                IF
                (
                    requested_interval_seconds / frequency_seconds
                    <= max_raw_points
                )
                OR
                (
                    frequency_seconds >= 86400
                )

                THEN

                    current_point_accuracy :=
                        'raw'::reading_line_accuracy;


                /*
                 * Otherwise use hourly data when possible.
                 */
                ELSIF
                (
                    requested_interval_seconds / 3600
                    <= max_hour_points
                )
                AND
                (
                    frequency_seconds <= 3600
                )

                THEN

                    current_point_accuracy :=
                        'hourly'::reading_line_accuracy;


                ELSE

                    current_point_accuracy :=
                        'daily'::reading_line_accuracy;

                END IF;

            END IF;

        END IF;



        /*
         * RAW READINGS
         *
         * Query readings directly and apply time-varying conversion.
         */
        IF (current_point_accuracy = 'raw'::reading_line_accuracy)

        THEN

            RETURN QUERY

            SELECT

                r.meter_id,

                CASE

                    WHEN u.unit_represent =
                        'quantity'::unit_represent_type

                    THEN

                        SUM(
                            (
                                EXTRACT(
                                    EPOCH FROM
                                    (
                                        upper(
                                            tsrange(
                                                c.start_time,
                                                c.end_time,
                                                '()'
                                            )
                                            *
                                            tsrange(
                                                r.start_timestamp,
                                                r.end_timestamp,
                                                '[]'
                                            )
                                        )
                                        -
                                        lower(
                                            tsrange(
                                                c.start_time,
                                                c.end_time,
                                                '()'
                                            )
                                            *
                                            tsrange(
                                                r.start_timestamp,
                                                r.end_timestamp,
                                                '[]'
                                            )
                                        )
                                    )
                                )
                                / 3600
                            )
                            *
                            (
                                c.slope *
                                (
                                    r.reading /
                                    (
                                        EXTRACT(
                                            EPOCH FROM
                                            (
                                                r.end_timestamp
                                                -
                                                r.start_timestamp
                                            )
                                        )
                                        / 3600
                                    )
                                )
                                +
                                c.intercept
                            )
                        )
                        /
                        (
                            EXTRACT(
                                EPOCH FROM
                                (
                                    r.end_timestamp
                                    -
                                    r.start_timestamp
                                )
                            )
                            / 3600
                        )


                    WHEN u.unit_represent IN
                    (
                        'flow'::unit_represent_type,
                        'raw'::unit_represent_type
                    )

                    THEN

                        SUM(
                            (
                                EXTRACT(
                                    EPOCH FROM
                                    (
                                        upper(
                                            tsrange(
                                                c.start_time,
                                                c.end_time,
                                                '()'
                                            )
                                            *
                                            tsrange(
                                                r.start_timestamp,
                                                r.end_timestamp,
                                                '[]'
                                            )
                                        )
                                        -
                                        lower(
                                            tsrange(
                                                c.start_time,
                                                c.end_time,
                                                '()'
                                            )
                                            *
                                            tsrange(
                                                r.start_timestamp,
                                                r.end_timestamp,
                                                '[]'
                                            )
                                        )
                                    )
                                )
                                / 3600
                            )
                            *
                            (
                                c.slope *
                                (
                                    r.reading * 3600
                                    / u.sec_in_rate
                                )
                                +
                                c.intercept
                            )
                        )
                        /
                        (
                            EXTRACT(
                                EPOCH FROM
                                (
                                    r.end_timestamp
                                    -
                                    r.start_timestamp
                                )
                            )
                            / 3600
                        )

                END AS reading_rate,


                CAST('NaN' AS DOUBLE PRECISION) AS min_rate,

                CAST('NaN' AS DOUBLE PRECISION) AS max_rate,

                r.start_timestamp,

                r.end_timestamp


            FROM readings r

            INNER JOIN meters m
                ON m.id = current_meter_id

            INNER JOIN units u
                ON m.unit_id = u.id

            INNER JOIN cik_vary c
                ON c.source_id = m.unit_id
                AND c.destination_id = passed_graphic_unit_id
                AND tsrange(
                        c.start_time,
                        c.end_time,
                        '()'
                    )
                    &&
                    tsrange(
                        r.start_timestamp,
                        r.end_timestamp,
                        '[]'
                    )

            WHERE lower(requested_range) <= r.start_timestamp
              AND r.end_timestamp <= upper(requested_range)
              AND r.meter_id = current_meter_id

            GROUP BY
                r.meter_id,
                r.start_timestamp,
                r.end_timestamp,
                u.unit_represent

            ORDER BY
                r.start_timestamp ASC;



        /*
         * HOURLY READINGS
         *
         * Uses TimescaleDB continuous aggregate.
         */
        ELSIF
            (current_point_accuracy =
                'hourly'::reading_line_accuracy)

        THEN

            RETURN QUERY

            SELECT

                hourly.meter_id,

                hourly.reading_rate,

                hourly.min_rate,

                hourly.max_rate,

                hourly.bucket AS start_timestamp,

                hourly.bucket + INTERVAL '1 hour'
                    AS end_timestamp


            FROM meter_hourly_readings_unit_cagg hourly


            WHERE requested_range @>
                tsrange(
                    hourly.bucket,
                    hourly.bucket + INTERVAL '1 hour',
                    '[]'
                )

            AND hourly.meter_id = current_meter_id

            AND hourly.graphic_unit_id =
                passed_graphic_unit_id


            ORDER BY
                start_timestamp ASC;



        /*
         * DAILY READINGS
         */
        ELSE

            RETURN QUERY

            SELECT

                daily.meter_id,

                daily.reading_rate,

                daily.min_rate,

                daily.max_rate,

                lower(daily.time_interval),

                upper(daily.time_interval)


            FROM meter_daily_readings_unit daily


            WHERE requested_range @>
                daily.time_interval

            AND daily.meter_id = current_meter_id

            AND daily.graphic_unit_id =
                passed_graphic_unit_id


            ORDER BY
                start_timestamp ASC;


        END IF;


        current_meter_index :=
            current_meter_index + 1;


    END LOOP;


END;

$$ LANGUAGE plpgsql;
