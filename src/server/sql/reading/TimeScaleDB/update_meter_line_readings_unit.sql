/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
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
 *       Uses the TimescaleDB continuous aggregate:
 *
 *           meter_daily_readings_unit_cagg
 *
 *       The daily continuous aggregate is built on top of:
 *
 *           meter_hourly_readings_unit_cagg
 *
 *       Daily aggregation reuses precomputed hourly aggregate values instead
 *       of recalculating from the hourly split hypertable.
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
 *       3. Daily continuous aggregate
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
 *   - The daily data path previously queried the PostgreSQL materialized view:
 *
 *         meter_daily_readings_unit
 *
 *     and now uses the TimescaleDB continuous aggregate:
 *
 *         meter_daily_readings_unit_cagg
 *
 *   - Design details:
 *
 *                           meter_line_readings_unit
 *                                     |
 *                    +----------------+----------------+
 *                    |                |                |
 *                    v                v                v
 *                readings     hourly continuous   daily continuous
 *                                 aggregate          aggregate
 *                                     |                |
 *                                     v                v
 *                      meter_hourly_readings_unit_cagg
 *                                                     |
 *                                                     v
 *                                      meter_daily_readings_unit_cagg
 */


/*
 * DAILY READINGS
 *
 * Uses TimescaleDB daily continuous aggregate.
 *
 * Data source:
 *
 *     meter_daily_readings_unit_cagg
 *
 * The daily continuous aggregate rolls up hourly aggregate values into
 * one-day intervals.
 *
 * The time interval is stored as a PostgreSQL tsrange:
 *
 *     ("2021-06-01 00:00:00","2021-06-02 00:00:00")
 *
 * The lower and upper bounds are converted back into timestamps so the
 * result matches the function return type.
 */


/*
The following function determines the correct duration view to query from, and returns averaged or raw reading from it.
It is designed to return data for plotting line graphs. It works on meters.
It is the new version of compressed_readings_2 that works with units. It takes these parameters:
meter_ids: A array of meter ids to query.
graphic_unit_id: The unit id of the unit to use for the graphic.
start_timestamp: The start timestamp of the data to return.
end_timestamp: The end timestamp of the data to return.
point_accuracy: Tells how decisions should be made on which types of points to return. 'auto' if automatic.
max_raw_points: The maximum number of data points to return if using the raw points for a meter. Only used if 'auto' for point_accuracy.
max_hour_points: The maximum number of data points to return if using the hour view. Only used if 'auto' for point_accuracy.
Details on how this function works can be found in the devDocs in the resource generalization document.
 */
-- New version of meter_line_readings_unit that uses the new views.
CREATE OR REPLACE FUNCTION meter_line_readings_unit (
	meter_ids INTEGER[],
	-- This is the graphic unit id, changed from graphic_unit_id to avoid confusion with the graphic unit id in the view.
	passed_graphic_unit_id INTEGER,
	start_stamp TIMESTAMP,
	end_stamp TIMESTAMP,
	point_accuracy reading_line_accuracy,
	max_raw_points INTEGER,
	max_hour_points INTEGER
)
	RETURNS TABLE(meter_id INTEGER, reading_rate FLOAT, min_rate FLOAT, max_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP)
AS $$
BEGIN
	RETURN QUERY
	/*
	 * Process all requested meters as one set. WITH ORDINALITY preserves the
	 * caller's meter order in the final result.
	 */
	WITH requested_meters AS (
		SELECT requested.id AS meter_id, requested.request_order
		FROM unnest(meter_ids) WITH ORDINALITY requested(id, request_order)
	),
	/*
	 * Use the readings indexes to find the first start and last end for every
	 * requested meter without aggregating its complete reading history.
	 */
	reading_bounds AS (
		SELECT
			requested.meter_id,
			first_reading.start_timestamp AS min_start_timestamp,
			last_reading.end_timestamp AS max_end_timestamp
		FROM (SELECT DISTINCT rm.meter_id FROM requested_meters rm) requested
		LEFT JOIN LATERAL (
			SELECT r.start_timestamp
			FROM readings r
			WHERE r.meter_id = requested.meter_id
			ORDER BY r.start_timestamp
			LIMIT 1
		) first_reading ON TRUE
		LEFT JOIN LATERAL (
			SELECT r.end_timestamp
			FROM readings r
			WHERE r.meter_id = requested.meter_id
			ORDER BY r.end_timestamp DESC
			LIMIT 1
		) last_reading ON TRUE
	),
	/*
	 * Restrict the requested range to the readings available for each meter.
	 * An absent reading bound produces an unbounded range, preserving the
	 * behavior of shrink_tsrange_to_real_readings().
	 */
	meter_ranges AS (
		SELECT
			rm.meter_id,
			rm.request_order,
			m.unit_id,
			m.reading_frequency,
			tsrange(start_stamp, end_stamp, '[]')
				* tsrange(bounds.min_start_timestamp, bounds.max_end_timestamp) AS requested_range
		FROM requested_meters rm
		INNER JOIN meters m ON m.id = rm.meter_id
		LEFT JOIN reading_bounds bounds ON bounds.meter_id = rm.meter_id
	),
	/*
	 * Select raw, hourly, or daily resolution independently for each meter.
	 *
	 * Raw is selected when the estimated number of readings does not exceed
	 * max_raw_points. A frequency of at least one day also stays raw because
	 * hourly or daily aggregation would interpolate additional points.
	 *
	 * Hourly is selected when the requested number of hours does not exceed
	 * max_hour_points and the meter frequency is no greater than one hour.
	 * All remaining meters use daily data.
	 */
	meter_resolutions AS (
		SELECT
			mr.*,
			CASE
				WHEN point_accuracy <> 'auto'::reading_line_accuracy THEN point_accuracy
				WHEN upper(mr.requested_range) = 'infinity'::TIMESTAMP THEN 'daily'::reading_line_accuracy
				WHEN (
					EXTRACT(EPOCH FROM (upper(mr.requested_range) - lower(mr.requested_range)))
						/ EXTRACT(EPOCH FROM mr.reading_frequency) <= max_raw_points
					OR EXTRACT(EPOCH FROM mr.reading_frequency) >= 86400
				) THEN 'raw'::reading_line_accuracy
				WHEN (
					EXTRACT(EPOCH FROM (upper(mr.requested_range) - lower(mr.requested_range))) / 3600
						<= max_hour_points
					AND EXTRACT(EPOCH FROM mr.reading_frequency) <= 3600
				) THEN 'hourly'::reading_line_accuracy
				ELSE 'daily'::reading_line_accuracy
			END AS selected_accuracy
		FROM meter_ranges mr
	),
	/*
	 * RAW READINGS
	 *
	 * Apply time-varying conversions directly to raw readings. Multiple
	 * cik_vary segments can overlap one reading, so each converted value is
	 * weighted by the duration of its overlap with that reading.
	 */
	raw_results AS (
		SELECT
			selected.request_order,
			r.meter_id,
			CASE
				WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
					/*
					 * Quantity readings are normalized to a per-hour rate before
					 * applying the conversion.
					 */
					SUM(
						(EXTRACT(EPOCH FROM (
							upper(tsrange(c.start_time, c.end_time, '()') * tsrange(r.start_timestamp, r.end_timestamp, '[]'))
							- lower(tsrange(c.start_time, c.end_time, '()') * tsrange(r.start_timestamp, r.end_timestamp, '[]'))
						)) / 3600)
						* (c.slope * (r.reading / (EXTRACT(EPOCH FROM (r.end_timestamp - r.start_timestamp)) / 3600)) + c.intercept)
					) / (EXTRACT(EPOCH FROM (r.end_timestamp - r.start_timestamp)) / 3600)
				WHEN u.unit_represent IN ('flow'::unit_represent_type, 'raw'::unit_represent_type) THEN
					/*
					 * Flow and raw readings are already rates. Normalize them to
					 * an hourly rate before applying the conversion.
					 */
					SUM(
						(EXTRACT(EPOCH FROM (
							upper(tsrange(c.start_time, c.end_time, '()') * tsrange(r.start_timestamp, r.end_timestamp, '[]'))
							- lower(tsrange(c.start_time, c.end_time, '()') * tsrange(r.start_timestamp, r.end_timestamp, '[]'))
						)) / 3600)
						* (c.slope * (r.reading * 3600 / u.sec_in_rate) + c.intercept)
					) / (EXTRACT(EPOCH FROM (r.end_timestamp - r.start_timestamp)) / 3600)
			END AS reading_rate,
			/*
			 * Raw meter data has no min/max range. NaN is converted to null by
			 * the route when the result is stored in Redux state.
			 */
			'NaN'::DOUBLE PRECISION AS min_rate,
			'NaN'::DOUBLE PRECISION AS max_rate,
			r.start_timestamp,
			r.end_timestamp
		FROM meter_resolutions selected
		INNER JOIN readings r ON r.meter_id = selected.meter_id
		INNER JOIN units u ON u.id = selected.unit_id
		INNER JOIN cik_vary c
			ON c.source_id = selected.unit_id
			AND c.destination_id = passed_graphic_unit_id
			/*
			 * Allow multiple time-varying conversion segments to contribute
			 * when they overlap a reading.
			 */
			AND c.start_time < r.end_timestamp
			AND c.end_time > r.start_timestamp
		WHERE selected.selected_accuracy = 'raw'::reading_line_accuracy
			AND r.start_timestamp >= lower(selected.requested_range)
			AND r.end_timestamp <= upper(selected.requested_range)
		/*
		 * unit_represent is stable for a meter, but PostgreSQL requires it in
		 * the GROUP BY because it controls the CASE expression above.
		 */
		GROUP BY
			selected.request_order,
			r.meter_id,
			r.start_timestamp,
			r.end_timestamp,
			u.unit_represent
	),
	/*
	 * HOURLY READINGS
	 *
	 * Use the TimescaleDB hourly continuous aggregate. Direct bucket bounds
	 * allow the meter/graphic-unit/bucket index to constrain the time range.
	 */
	hourly_results AS (
		SELECT
			selected.request_order,
			hourly.meter_id,
			hourly.reading_rate,
			hourly.min_rate,
			hourly.max_rate,
			hourly.bucket AS start_timestamp,
			hourly.bucket + INTERVAL '1 hour' AS end_timestamp
		FROM meter_resolutions selected
		INNER JOIN meter_hourly_readings_unit_cagg hourly
			ON hourly.meter_id = selected.meter_id
			AND hourly.graphic_unit_id = passed_graphic_unit_id
			AND hourly.bucket >= lower(selected.requested_range)
			AND hourly.bucket <= upper(selected.requested_range) - INTERVAL '1 hour'
		WHERE selected.selected_accuracy = 'hourly'::reading_line_accuracy
	),
	/*
	 * DAILY READINGS
	 *
	 * Use the TimescaleDB daily continuous aggregate with the same indexable
	 * complete-bucket bounds.
	 */
	daily_results AS (
		SELECT
			selected.request_order,
			daily.meter_id,
			daily.reading_rate,
			daily.min_rate,
			daily.max_rate,
			daily.bucket AS start_timestamp,
			daily.bucket + INTERVAL '1 day' AS end_timestamp
		FROM meter_resolutions selected
		INNER JOIN meter_daily_readings_unit_cagg daily
			ON daily.meter_id = selected.meter_id
			AND daily.graphic_unit_id = passed_graphic_unit_id
			AND daily.bucket >= lower(selected.requested_range)
			AND daily.bucket <= upper(selected.requested_range) - INTERVAL '1 day'
		WHERE selected.selected_accuracy = 'daily'::reading_line_accuracy
	),
	/*
	 * Each meter appears in exactly one resolution branch. UNION ALL avoids
	 * unnecessary duplicate elimination.
	 */
	results AS (
		SELECT * FROM raw_results
		UNION ALL
		SELECT * FROM hourly_results
		UNION ALL
		SELECT * FROM daily_results
	)
	SELECT
		results.meter_id,
		results.reading_rate,
		results.min_rate,
		results.max_rate,
		results.start_timestamp,
		results.end_timestamp
	FROM results
	-- Preserve the original per-meter chronological result ordering.
	ORDER BY results.request_order, results.start_timestamp;
END;
$$ LANGUAGE 'plpgsql';
