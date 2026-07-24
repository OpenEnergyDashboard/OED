# Technical Handover Document

# TimescaleDB Migration for Meter Reading Aggregation

## 1. Project Overview

This document provides a technical handover for the TimescaleDB migration work completed as part of the meter reading aggregation optimization project.

The goal of this work was to replace the existing PostgreSQL materialized-view-based aggregation workflow with a TimescaleDB-based architecture using hypertables and continuous aggregates.

The existing system relied on PostgreSQL materialized views to provide hourly and daily meter readings. While functionally correct, refreshing these materialized views became increasingly expensive as data volume increased.

The new architecture introduces:

- TimescaleDB hypertables for optimized time-series storage.
- Continuous aggregates for incremental aggregation.
- Precomputed hourly split data to avoid repeated calculations.
- Cached dependency tables to support group-level aggregation.
- Updated application initialization and refresh workflows.
- Benchmarking and validation tools to compare the new and old implementations.

The migration preserved analytical correctness while significantly improving aggregation refresh performance.


---

# 2. Background

## Existing Architecture

Before this project, the reporting workflow depended on PostgreSQL materialized views:

    readings
       |
       v
    meter_hourly_readings_unit
       |
       v
    meter_daily_readings_unit
       |
       v
    group_hourly_readings_unit
       |
       v
    group_daily_readings_unit


The materialized views performed:

- Hourly aggregation
- Daily aggregation
- Unit conversion
- Time-varying conversion handling
- Group aggregation

The main limitations were:

- Refreshes required recalculating large portions of historical data.
- Hourly and daily views duplicated aggregation work.
- Runtime queries required joins against conversion tables.
- Group aggregation depended on database objects incompatible with TimescaleDB continuous aggregates.


---

# 3. Project Goals

The migration focused on the following goals:

## Performance

Reduce refresh time for hourly and daily aggregations by using TimescaleDB incremental aggregation.

## Correctness

Maintain identical analytical results compared with the existing PostgreSQL materialized views.

## Scalability

Create an architecture that can support larger datasets and more frequent updates.

## Maintainability

Move expensive calculations into predictable refresh workflows instead of runtime queries.


---

# 4. Final Architecture

The implemented data flow is:

                    readings
                       |
                       v
             hypertable_hourly_split
                       |
                       v
        +----------------------------------+
        |                                  |
        v                                  v
    meter_hourly_readings_unit_cagg     meter_daily_readings_unit_cagg
        |                                  |
        v                                  v
    group_hourly_readings_unit_cagg     group_daily_readings_unit_cagg


The design follows a layered aggregation approach:

1. Raw readings are converted into hourly slices.
2. Hourly slices are aggregated into meter hourly results.
3. Hourly results are rolled into daily results.
4. Meter results are rolled into group results.


---

# 5. Implemented Database Components

## 5.1 hypertable_hourly_split

File: create_prerequisites.sql


Purpose:

Create the TimescaleDB hypertable that stores hourly reading slices.

The table contains:

- Reading contribution for the hourly overlap period.
- Conversion information.
- Graphic unit metadata.
- Unit information required for aggregation.


Why it was introduced:

Previously, hourly calculations repeatedly split readings and joined against conversion metadata.

The new design performs this work once and stores the result.


Benefits:

- Removes repeated hourly split calculations.
- Avoids runtime joins against cik_vary.
- Provides a stable source for continuous aggregates.


Data flow:

    readings
       |
       v
    hypertable_hourly_split


---

## 5.2 Meter Hourly Continuous Aggregate

File: create_hourly_readings.sql


Created object: meter_hourly_readings_unit_cagg


Purpose:

Replacement for: meter_hourly_readings_unit


Responsibilities:

- Hourly bucketing.
- Unit conversion.
- Time-varying conversion application.
- Hourly statistics calculation.


The continuous aggregate uses: hypertable_hourly_split


as its source.

This avoids recalculating:

- Hour boundaries.
- Overlap durations.
- Conversion values.


---

## 5.3 Meter Daily Continuous Aggregate

File: create_daily_readings.sql


Created object: meter_daily_readings_unit_cagg


Purpose:

Replacement for: meter_daily_readings_unit


Important design decision:

The daily aggregate is built from:

meter_hourly_readings_unit_cagg


instead of: hypertable_hourly_split


Reason:

Hourly values are already calculated and validated.

This allows TimescaleDB to reuse hourly results instead of repeating expensive calculations.

# 6. Group Aggregation Implementation

## Challenge

The original group aggregation depended on:

- Recursive views
- PL/pgSQL functions

Examples:

groups_deep_meters

get_graphic_unit()


These dependencies cannot be directly used inside TimescaleDB continuous aggregates.


## Solution

Introduced cache tables that are refreshed before group aggregate refreshes.

Architecture:


groups_immediate_children
          |
          v
groups_deep_children
          |
          v
groups_deep_meters_cache
          |
          v
group_graphic_units_cache
          |
          v
group continuous aggregates



Implemented components:

- Group dependency cache tables.
- Cache refresh functions.
- Group hourly continuous aggregate.
- Group daily continuous aggregate.


---

# 7. Application Integration

The database creation and seeding process was updated to automatically create and maintain the new TimescaleDB objects.

Implemented in: TimeScaleDB/Reading.js


Added functionality:

## Creation

Functions added:


- createPrerequisites()

- createGroupDependencies()

- createHourlyReadings()

- createDailyReadings()

- createGroupHourlyReadings()

- createGroupDailyReadings()



## Query Integration

Updated:

- meter_line_readings_unit()

- group_line_readings_unit()


The functions now use:

Hourly: meter_hourly_readings_unit_cagg


Daily: meter_daily_readings_unit_cagg



Group queries use:

- group_hourly_readings_unit_cagg

- group_daily_readings_unit_cagg



## Refresh Workflow

Refresh order:

1. Rebuild hypertable_hourly_split.
2. Refresh meter hourly aggregate.
3. Refresh meter daily aggregate.
4. Refresh group dependency caches.
5. Refresh group hourly aggregate.
6. Refresh group daily aggregate.


This order is required because later aggregates depend on earlier ones.


---

# 8. Benchmarking

A complete benchmark suite was created to compare:

## Legacy Implementation

- meter_hourly_readings_unit

- meter_daily_readings_unit

- group_hourly_readings_unit

- group_daily_readings_unit


Against:


## TimescaleDB Implementation

- meter_hourly_readings_unit_cagg

- meter_daily_readings_unit_cagg

- group_hourly_readings_unit_cagg

- group_daily_readings_unit_cagg



Benchmark scenarios included:

- New data appended after existing history.
- Historical inserts before existing data.
- Historical replacement updates.
- 1 day ranges.
- 1 week ranges.
- 1 month ranges.
- 1 year ranges.


---

# 9. Benchmark Results

## Correctness Validation

Results:


| Aggregate | Legacy Rows | Timescale Rows | Mismatches |
|-----------|-------------|----------------|------------|
| Hourly    | 157,896     | 157,896        | 0          |
| Daily     | 6,579       | 6,579          | 0          |


Comparison tolerance:

1 x 10^-11


All comparisons passed.


Validated:

- reading_rate
- min_rate
- max_rate
- time intervals
- missing rows

# 10. Performance Results

## Hourly Refresh

Legacy: ~8.4 seconds


TimescaleDB: ~33 milliseconds



Improvement: Approximately 250x faster



---

## Daily Refresh

Legacy: ~5.1 seconds


TimescaleDB: ~15 milliseconds



Improvement: Approximately 340x faster



---

# 11. Storage Considerations

New storage requirements:


| Object | Size |
|--------|------|
| readings | 33 MB |
| hypertable_hourly_split | 1.3 GB |
| hourly continuous aggregate | 218 MB |
| daily continuous aggregate | 12 MB |


The largest increase comes from: hypertable_hourly_split


This is expected because it stores precomputed hourly slices.


The storage increase provides:

- Faster refreshes.
- Reduced runtime computation.
- Better scalability.


---

# 12. Files Added / Modified

## SQL

- TimeScaleDB/create_prerequisites.sql

- TimeScaleDB/create_group_dependencies.sql

- TimeScaleDB/create_hourly_readings.sql

- TimeScaleDB/create_daily_readings.sql

- TimeScaleDB/create_group_hourly_readings.sql

- TimeScaleDB/create_group_daily_readings.sql

- TimeScaleDB/CompareHourlyReadings.sql

- TimeScaleDB/CompareDailyReadings.sql

- TimeScaleDB/CompareGroupHourlyReadings.sql

- TimeScaleDB/CompareGroupDailyReadings.sql



## Application

TimeScaleDB/Reading.js


Updated to manage:

- Creation.
- Refresh.
- Rebuild.
- Integration with database setup.


---

# 13. Future Work / Recommendations

The next cohort should consider:


## Refresh Policies

Evaluate TimescaleDB background refresh policies instead of only manual refresh calls.

Integrate:
- bar (meter, group) in src/server/sql/reading/create_reading_views.sql. These use the daily views so should be easy to convert.
- compare bar in src/server/sql/reading/create_function_get_compare_readings.sql. Similar to bar but uses hourly.
- 3D in src/server/sql/reading/create_function_get_3d_readings.sql. Uses the hourly tables.
- Compare line and radar use the line readings so these should automatically work as the line readings are done. However, they should be looked at to verify it functions properly
- Map uses the compare bar reading so do similarly to compare line/radar.


## Issues

Find out why:
- The issue of why TSD PG17+ fails needs to be figured out. The desire is to understand the underlying reason and come up with appropriate fixes.


## Storage Optimization

Investigate:

- Chunk sizing.
- Compression.
- Retention policies.


## Additional Benchmarking

Test with:

- Larger datasets.
- Multiple meters.
- Higher frequency readings.


## Monitoring

Add monitoring for:

- Continuous aggregate refresh duration.
- Hypertable growth.
- Refresh failures.


---

# 14. Lessons Learned

## Continuous Aggregates Require Careful Dependency Planning

Objects used by continuous aggregates cannot rely on:

- Recursive views.
- Dynamic functions.
- Runtime calculations.


Data needed for aggregation should be materialized before aggregation.


## Hierarchical Aggregation Provides Significant Benefits

Building:

daily -> hourly -> raw


is more efficient than recalculating from raw data.


## Correctness Validation Is Essential

Performance improvements are only valuable when analytical results remain unchanged.

The migration succeeded because every aggregate was compared against the legacy implementation.


---

# 15. Acknowledgements

Martin contributed initial work toward integrating the group views and provided an important foundation for the group aggregation implementation.

Dr. Huss-Lederman provided valuable guidance through testing, verification, and feedback. His involvement helped validate both the technical correctness and performance improvements of the final implementation.


---

# 16. Current Status

The TimescaleDB migration has been implemented, benchmarked, and validated.


Current results:

- Correctness: Passed.
- Performance: Significantly improved.
- Architecture: Ready for continued development.


Future contributors should use this document as the starting point when extending or optimizing the TimescaleDB aggregation workflow.
