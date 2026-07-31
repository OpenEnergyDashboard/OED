# TimescaleDB Meter Reading Aggregation Handover

## Purpose and current status

This document describes the TimescaleDB meter-reading implementation as it
exists in the current codebase. The implementation replaces the active
PostgreSQL materialized-view query paths with a TimescaleDB hypertable and four
continuous aggregates.

The current implementation provides:

- Incremental maintenance of preprocessed hourly reading slices.
- Hourly and daily meter continuous aggregates.
- Hourly and daily group continuous aggregates.
- Physical dependency caches for group membership and compatible graphic
  units.
- Bounded aggregate refreshes for import paths that provide an accepted time
  range.
- Revision-based full rebuilds when denormalized conversion or unit metadata
  becomes stale.
- Revision-based group-cache refreshes.
- Batched application-level reading ingestion.
- Index-aware meter and group graph queries.

The TimescaleDB path is integrated and covered by database and web tests, but
some cleanup and operational tuning remain. In particular, legacy code is
still retained, the daily meter aggregate is not hierarchical, and no explicit
chunk interval, compression policy, retention policy, or continuous-aggregate
refresh policy is configured.

The development database image is currently pinned in
[`containers/database/Dockerfile`](containers/database/Dockerfile) to:

```text
timescale/timescaledb:2.27.2-pg17
```

Treat the code and SQL files linked in this document as the source of truth.
Historical benchmark figures should not be treated as current performance
measurements unless they are rerun against the current implementation and
representative production-scale data.

## Architecture

### Meter aggregation

The meter hourly and meter daily aggregates are sibling consumers of
`hypertable_hourly_split`.

```text
readings
   |
   | row-level INSERT/UPDATE/DELETE trigger
   v
hypertable_hourly_split
   |
   +-------------------------------+
   |                               |
   v                               v
meter_hourly_readings_unit_cagg    meter_daily_readings_unit_cagg
```

The current daily aggregate does **not** roll up
`meter_hourly_readings_unit_cagg`. It reads the split hypertable directly so it
can preserve duration-weighted calculations and track invalidations from the
underlying time dimension.

### Group aggregation

Group continuous aggregates consume the corresponding meter resolution and
join physical cache tables:

```text
groups_immediate_children       groups_immediate_meters
             |                           |
             +-------------+-------------+
                           |
                           v
              groups_deep_meters_cache
                           |
                           v
              group_graphic_units_cache

meter_hourly_readings_unit_cagg + group caches
                           |
                           v
             group_hourly_readings_unit_cagg

meter_daily_readings_unit_cagg + group caches
                           |
                           v
             group_daily_readings_unit_cagg
```

The caches are necessary because continuous aggregates cannot directly depend
on the recursive and dynamic logic previously used to resolve nested groups
and graphic-unit compatibility.

## Core database objects

| Object | Type | Purpose |
|---|---|---|
| `readings` | PostgreSQL table | Authoritative raw meter readings |
| `hypertable_hourly_split` | TimescaleDB hypertable | Hour-bounded reading contributions with copied conversion and unit metadata |
| `meter_hourly_readings_unit_cagg` | Continuous aggregate | Duration-weighted meter values by hour |
| `meter_daily_readings_unit_cagg` | Continuous aggregate | Duration-weighted meter values by day |
| `groups_deep_meters_cache` | PostgreSQL table | Flattened group-to-meter relationships |
| `group_graphic_units_cache` | PostgreSQL table | Graphic units supported by every meter unit in a group |
| `group_hourly_readings_unit_cagg` | Continuous aggregate | Sum of compatible meter values by group and hour |
| `group_daily_readings_unit_cagg` | Continuous aggregate | Sum of compatible meter values by group and day |
| `reading_aggregate_state` | PostgreSQL table | Revision counters for pending split rebuilds and group-cache refreshes |

The primary SQL definitions are:

- [`create_prerequisites.sql`](src/server/sql/reading/TimeScaleDB/create_prerequisites.sql)
- [`create_hourly_readings.sql`](src/server/sql/reading/TimeScaleDB/create_hourly_readings.sql)
- [`create_daily_readings.sql`](src/server/sql/reading/TimeScaleDB/create_daily_readings.sql)
- [`create_group_dependencies.sql`](src/server/sql/reading/TimeScaleDB/create_group_dependencies.sql)
- [`create_group_hourly_readings.sql`](src/server/sql/reading/TimeScaleDB/create_group_hourly_readings.sql)
- [`create_group_daily_readings.sql`](src/server/sql/reading/TimeScaleDB/create_group_daily_readings.sql)

## Reading ingestion and split-table maintenance

### Application-level batching

The bulk methods in
[`src/server/models/Reading.js`](src/server/models/Reading.js) insert readings
in transactional batches of 1,000 rows using `jsonb_to_recordset`.

This reduces application-to-database round trips while preserving the existing
conflict behavior:

- `insertAll()` fails on a conflicting primary key.
- `insertOrIgnoreAll()` keeps an existing row.
- `insertOrUpdateAll()` changes only the reading value on conflict.
- Repeated keys in one upsert input retain the first end timestamp and the
  final reading value, matching the former sequential behavior.

Application-level batching does not make split-table maintenance
statement-level. PostgreSQL still invokes the existing trigger once for each
inserted, updated, or deleted reading.

### Row-level maintenance trigger

`trigger_readings_update_hourly_hypertable` executes
`update_hourly_hypertable()` after each changed `readings` row.

For an insert, the function:

1. Resolves the meter unit.
2. Finds overlapping `cik_vary` conversion segments.
3. Generates each hour touched by the reading.
4. Calculates the reading contribution for each overlap.
5. Copies `unit_represent`, `sec_in_rate`, slope, intercept, and graphic-unit
   information into `hypertable_hourly_split`.

For an update, it removes the old split rows and creates replacements. For a
delete, it removes the corresponding split rows.

This denormalization makes aggregate refreshes faster, but means existing split
rows become stale when copied conversion or unit metadata changes. The rebuild
revision mechanism handles that case.

## Continuous aggregates

### Meter hourly

`meter_hourly_readings_unit_cagg` groups split rows by:

- meter
- graphic unit
- one-hour bucket
- unit representation
- seconds in rate

It calculates a duration-weighted `reading_rate` plus `min_rate` and
`max_rate`.

### Meter daily

`meter_daily_readings_unit_cagg` groups
`hypertable_hourly_split` directly into one-day buckets. It does not currently
use the meter hourly continuous aggregate as its source.

Do not replace the current weighted calculation with a simple average of
hourly averages. A correct hierarchical design would need to expose and roll
up sufficient intermediate state, including weighted sums, durations, minimums,
and maximums.

### Group hourly and daily

The group aggregates sum compatible meter aggregate values for each flattened
group membership:

- Group hourly reads meter hourly.
- Group daily reads meter daily.

Changes to ordinary relational join tables are not automatically tracked as
continuous-aggregate invalidations. The application therefore refreshes the
dependency caches when their revision is dirty before refreshing the group
aggregates.

### Real-time behavior

All four continuous aggregates currently set:

```sql
timescaledb.materialized_only = false
```

Queries can therefore include recent, unmaterialized source data. This favors
freshness, but it can add query-time work. Changing to materialized-only mode
requires confidence that every write path reliably refreshes the affected
window.

## Refresh and rebuild workflow

The application entry point is
[`src/server/services/refreshAllReadingViews.js`](src/server/services/refreshAllReadingViews.js).
It uses a shared PostgreSQL advisory lock so concurrent import jobs do not
refresh the same aggregates simultaneously.

### Normal refresh

If no rebuild is pending, the application performs:

1. Meter hourly refresh.
2. Meter daily refresh.
3. Group-cache refresh only when the group-cache revision is pending.
4. Group hourly refresh.
5. Group daily refresh.

For a bounded import, hourly refreshes expand the affected range to complete
hour boundaries and daily refreshes expand it to complete day boundaries. This
gives each aggregate the smallest complete refresh window covering the changed
readings.

The eGauge polling path combines successful meter import ranges and performs
one bounded refresh. The CSV upload path also supplies its accepted range when
available.

The MAMAC updater does not currently return its accepted range or refresh the
aggregates itself. The provided deployment scripts run MAMAC acquisition and
aggregate refresh as separate cron jobs:

- [`updateMamacMetersOEDCron.bash`](src/scripts/updateMamacMetersOEDCron.bash)
- [`refreshReadingViewsCron.bash`](src/scripts/refreshReadingViewsCron.bash)

That periodic refresh is unbounded. Do not assume every acquisition path
currently receives the same bounded-refresh optimization.

Calling `refreshAllReadingViews()` without bounds refreshes all materialized
aggregate data. It does **not** by itself rebuild
`hypertable_hourly_split`.

### Conditional full rebuild

A full split-table rebuild occurs only when:

- The caller explicitly passes `rebuild: true`; or
- `rebuild_revision` is greater than `completed_rebuild_revision`.

`rebuild_hourly_hypertable_split()` deletes and regenerates all split rows from
the current `readings`, meter, unit, and `cik_vary` data. All four continuous
aggregates are then refreshed.

Revision counters are used instead of booleans so a metadata change committed
while a rebuild is running remains pending for the next rebuild.

The following changes mark the split table stale:

| Change | Effect |
|---|---|
| `meters.unit_id` changes | Increment rebuild revision and group-cache revision |
| `units.unit_represent` changes | Increment rebuild revision |
| `units.sec_in_rate` changes | Increment rebuild revision |
| `cik`/`cik_vary` replacement | Increment rebuild revision and group-cache revision |

### Conditional group-cache refresh

The following changes increment `group_cache_revision`:

- Meter unit changes.
- Inserts, updates, or deletes in `groups_immediate_children`.
- Inserts, updates, or deletes in `groups_immediate_meters`.
- Replacement of `cik` and `cik_vary`.

Normal reading imports do not refresh the group caches. When a cache refresh is
required, each cache function calculates its desired rows once with a
`MATERIALIZED` CTE, deletes stale rows, and inserts missing rows.

As with rebuild tracking, only the revision observed before the refresh is
marked complete. A concurrent metadata change remains pending.

## Refresh commands

From the web container or an environment with project dependencies installed:

```bash
# Refresh all continuous aggregates without forcing a split rebuild.
npm run refreshAllReadingViews

# Force a complete split-table rebuild and refresh all aggregates.
npm run rebuildAllReadingViews

# Recalculate conversion paths and rebuild the dependent reading data.
npm run updateCikAndViews
```

Use the forced rebuild only when it is required. It deletes and recreates the
entire split hypertable and is intentionally more expensive than an aggregate
refresh.

## State inspection

The pending maintenance state can be inspected with:

```sql
SELECT
    rebuild_revision,
    completed_rebuild_revision,
    group_cache_revision,
    completed_group_cache_revision
FROM reading_aggregate_state
WHERE id = 1;
```

A split rebuild is pending when:

```text
rebuild_revision > completed_rebuild_revision
```

A group-cache refresh is pending when:

```text
group_cache_revision > completed_group_cache_revision
```

Do not manually set the completed revisions ahead of the source revisions.
Doing so can hide stale derived data.

## Query integration and performance work

The active graph functions are installed during schema creation and query the
TimescaleDB aggregates:

- [`update_meter_line_readings_unit.sql`](src/server/sql/reading/TimeScaleDB/update_meter_line_readings_unit.sql)
- [`update_group_line_readings_unit.sql`](src/server/sql/reading/TimeScaleDB/update_group_line_readings_unit.sql)
- [`update_meter_group_bar.sql`](src/server/sql/reading/TimeScaleDB/update_meter_group_bar.sql)
- [`update_function_get_compare_readings.sql`](src/server/sql/reading/TimeScaleDB/update_function_get_compare_readings.sql)
- [`update_function_get_3d_readings.sql`](src/server/sql/reading/TimeScaleDB/update_function_get_3d_readings.sql)
- [`update_reading_views.sql`](src/server/sql/reading/TimeScaleDB/update_reading_views.sql)

Current query optimizations include:

- Set-based processing of requested meters in the meter line function.
- Direct timestamp predicates on CAGG buckets for index and chunk pruning.
- Indexed first/last raw-reading lookups instead of full-history bound scans.
- Indexed group-bound discovery through each member meter's first and last
  reading.
- `UNION ALL` between mutually exclusive raw, hourly, and daily result paths.
- A single multi-meter count query for the readings count endpoint.
- Removal of unnecessary materialization ordering from the meter daily CAGG.

## Important indexes

| Index | Primary use |
|---|---|
| `readings` primary key `(meter_id, start_timestamp)` | Inserts, raw time queries, first-reading lookup |
| `readings_meter_end_timestamp_idx (meter_id, end_timestamp DESC)` | Latest reading-end lookup |
| `hypertable_hourly_split_meter_graphic_time_idx` | Meter/graphic-unit/time access |
| `hypertable_hourly_split_meter_time_idx` | Split-row uniqueness and maintenance |
| `cik_vary_source_time_idx` | Trigger conversion lookup by source and overlap bounds |
| `groups_deep_meters_cache` primary key `(group_id, meter_id)` | Group-to-meter lookup |
| `groups_deep_meters_cache_meter_group_idx (meter_id, group_id)` | Meter-to-group joins during group aggregation |
| Meter CAGG `(meter_id, graphic_unit_id, bucket)` indexes | Meter graph queries and range scans |
| Group CAGG `(group_id, graphic_unit_id, bucket)` indexes | Group graph queries and range scans |

Avoid adding equivalent indexes without checking production query plans and
write overhead.

## Schema initialization

[`src/server/models/database.js`](src/server/models/database.js) creates the
TimescaleDB objects in this order:

1. Shared reading helpers.
2. Split hypertable, indexes, state tracking, and triggers.
3. Group dependency caches.
4. Meter hourly CAGG.
5. Meter daily CAGG.
6. Group hourly CAGG.
7. Group daily CAGG.
8. Meter/group line functions.
9. Bar functions.
10. Compare functions.
11. 3-D functions.

Creation scripts use several `IF NOT EXISTS` clauses to support fresh or
partially initialized schemas. `IF NOT EXISTS` does not update the definition
of an already existing continuous aggregate. Existing deployments still need
the repository's normal migration or deployment process to apply definition
changes safely.

## Testing and validation

Relevant automated coverage includes:

- [`readingTests.js`](src/server/test/db/readingTests.js)
- [`unitReadingsTests.js`](src/server/test/db/unitReadingsTests.js)
- [`compareTests.js`](src/server/test/db/compareTests.js)
- [`cikVaryTests.js`](src/server/test/db/cikVaryTests.js)
- [`groupTests.js`](src/server/test/db/groupTests.js)
- The meter and group reading API suites under
  [`src/server/test/web`](src/server/test/web)

Useful focused commands include:

```bash
docker compose exec web npx mocha \
  "src/server/test/db/readingTests.js" \
  --timeout 15000 --full-trace

docker compose exec web npx mocha \
  "src/server/test/web/readingsLineGroupQuantity.js" \
  --timeout 15000 --full-trace
```

During the latest handover review, the focused reading model/API suite passed
8 tests and the group quantity line suite passed 15 tests. These tests cover
the recent batching, multi-meter count, and indexed group-bound changes, but
they are not a substitute for production-volume performance testing.

### Historical benchmark results

Earlier migration work compared the legacy materialized views with the
TimescaleDB continuous aggregates and reported no meter hourly or daily
mismatches for its benchmark dataset at a tolerance of `1e-11`.

The same work demonstrated large refresh improvements for small changed
windows. The improvement ratio varied substantially with the changed range;
figures such as approximately 250 times hourly and 340 times daily represented
specific one-day scenarios, not every scenario.

Those results remain useful historical evidence for the design, but they
predate later changes to ingestion, refresh-state handling, cache maintenance,
indexes, and query functions. Rerun benchmarks before using those figures to
describe current or production performance.

## Legacy status

The active schema creation and query paths use the TimescaleDB objects.
However, legacy compatibility code remains:

- Deprecated methods in
  [`src/server/models/Reading.js`](src/server/models/Reading.js).
- Commented legacy setup and refresh calls.
- [`drop_legacy_reading_views.sql`](src/server/sql/reading/TimeScaleDB/drop_legacy_reading_views.sql),
  whose application call is currently not enabled.
- Legacy SQL definitions retained for compatibility and historical reference.

Fresh schemas do not create the legacy reading materialized views through the
active setup path. An existing database may still contain legacy objects until
they are deliberately removed through an appropriate migration. Do not remove
them solely because they are deprecated without checking deployment and
rollback requirements.

## Known limitations and remaining opportunities

### Row-level split maintenance

Application inserts are batched, but `update_hourly_hypertable()` remains a
row-level trigger. Large imports still perform conversion joins and
`generate_series()` work for every source reading. A statement-level trigger
using transition tables, or a controlled bulk split-generation path, could
reduce this overhead. It would be a substantial change and needs careful
INSERT/UPDATE/DELETE compatibility testing.

### Non-hierarchical daily aggregation

Meter daily still reads `hypertable_hourly_split`. A future hierarchical
aggregate could reduce daily refresh work, but it must expose enough
intermediate state to preserve weighted averages, minimums, maximums, and
partial-hour behavior.

### 3-D, compare, and bar queries

The principal line-query paths have received the most optimization. Remaining
opportunities include:

- Set-based 3-D meter processing instead of a PL/pgSQL meter loop.
- Indexed first/last CAGG bucket lookup in 3-D and bar range helpers.
- Combining current and previous compare-period scans.
- Replacing some `generate_series()` range joins with direct bucketing where
  identical output semantics can be retained.

Use `EXPLAIN (ANALYZE, BUFFERS)` with representative data before changing
indexes or query structure.

### TimescaleDB operational tuning

The code currently has no explicit:

- Hypertable chunk interval.
- Compression/columnstore policy.
- Retention policy.
- Continuous-aggregate refresh policy.

These settings should be based on production ingestion volume, common query
ranges, late-arriving data, storage constraints, and the installed TimescaleDB
version. Do not select them from the historical benchmark dataset alone.

### Real-time versus materialized-only aggregates

`materialized_only = false` keeps recent values visible but can add query-time
work. Benchmark `materialized_only = true` only after auditing every import and
metadata-change path for reliable bounded refreshes.

### Import concurrency

Meter network requests and their database writes may run concurrently. A large
meter fleet can place pressure on the connection pool and the row-level split
trigger. A configurable concurrency limit is worth evaluating with production
meter counts.

### Benchmark and observability coverage

Before production rollout or major tuning:

- Benchmark end-to-end import plus refresh time, not refresh time alone.
- Include append, backfill, and replacement scenarios.
- Include representative meters, units, conversions, group depth, and reading
  frequencies.
- Measure split-table and CAGG storage.
- Capture query plans for line, bar, compare, and 3-D endpoints.
- Monitor advisory-lock wait time and aggregate-refresh duration.

## Safe maintenance guidance

- Prefer bounded refreshes after ordinary reading imports.
- Use a forced rebuild only for stale copied metadata or explicit recovery.
- Preserve the meter-before-group refresh order.
- Refresh group caches before group CAGGs when their revision is pending.
- Do not update revision counters manually unless repairing a known and
  verified state issue.
- Do not average already averaged rates without carrying their weights.
- Preserve trigger and cache behavior when changing ingestion methods.
- Test empty groups, nested groups, repeated meters, conversion changes,
  partial buckets, and missing readings.

## File map

### Application orchestration

- [`src/server/models/TimeScaleDB/Reading.js`](src/server/models/TimeScaleDB/Reading.js):
  schema object creation and bounded CAGG refresh functions.
- [`src/server/services/refreshAllReadingViews.js`](src/server/services/refreshAllReadingViews.js):
  advisory locking, conditional rebuild selection, and refresh orchestration.
- [`src/server/models/Reading.js`](src/server/models/Reading.js):
  raw reading access, batched writes, and graph-query wrappers.
- [`src/server/models/CikVary.js`](src/server/models/CikVary.js):
  bulk conversion replacement and derived-data revision invalidation.
- [`src/server/services/eGauge/updateEgaugeMeters.js`](src/server/services/eGauge/updateEgaugeMeters.js):
  bounded refresh after scheduled eGauge imports.
- [`src/server/services/updateMamacMeters.js`](src/server/services/updateMamacMeters.js):
  MAMAC acquisition; aggregate refresh remains a separate scheduled job.
- [`src/server/routes/csv.js`](src/server/routes/csv.js):
  bounded refresh after CSV reading uploads.

### SQL

- [`src/server/sql/reading/create_readings_table.sql`](src/server/sql/reading/create_readings_table.sql)
- [`src/server/sql/reading/TimeScaleDB`](src/server/sql/reading/TimeScaleDB)
- [`src/server/sql/reading/get_count_by_meter_ids_and_date_range.sql`](src/server/sql/reading/get_count_by_meter_ids_and_date_range.sql)

## Summary

The current TimescaleDB implementation is the active meter and group
aggregation path. It incrementally maintains a denormalized hourly split
hypertable, refreshes four real-time continuous aggregates, conditionally
rebuilds copied metadata, conditionally synchronizes group caches, batches
application inserts, and uses index-friendly graph queries.

It should be described as integrated and validated—not as fully optimized or
fully cleaned up. The main remaining areas are legacy removal through a safe
migration, statement-level split maintenance, hierarchical daily aggregation,
3-D/compare/bar query tuning, TimescaleDB storage policies, and
production-scale benchmarking.
