# Testing the OED fast-pt compressed readings system

*fastPts fork commit Hash: #*

**We use a JS script to perform these tests rather than manually because there are many tests and also because we found that using a script has no significant difference when compared to manually requesting data via the web interface.**

We test each data set as a way to observe the time taken for each switch level down the compressed readings function (compressed_readings_2 function).

To test OED, we load the following dataset:

| Dataset                  | Command to generate/Source   |
| ------------------------ | ---------------------------- |
| 1-Minute Data for 1 year | generateOneMinuteTestingData |

## Default OED

We use a node script to time the average time (of 10 requests) it takes for a request for data to return. The elasped time of the request is recorded in the rightmost column. We specifically chose intervals that provoke shifts in views in the db, and to test whether the amount of time take is linearly related to the amount of data points.

| Interval                                      | ~ Expected number of points | Actual number of points* | Expected View        | 1-Minute Data (ms) |
| --------------------------------------------- | --------------------------- | ------------------------ | -------------------- | ------------------ |
| Jan 01, 2020 00:00:00 - Apr 15, 2020 00:00:00 | 106 days                    | 105                      | Materialized daily   | 84.7               |
| Jan 01, 2020 00:00:00 - Feb 22, 2020 00:00:00 | 53 days                     | 52                       | Materialized daily   | 78.6               |
| Jan 01, 2020 00:00:00 - Feb 19, 2020 00:00:00 | 50 days                     | 1176                     | Materialized daily** | 4982.8             |
| Jan 03, 2020 08:00:00 - Feb 14, 2020 23:00:00 | 1024 hours (~42 days)       | 1023                     | Hourly               | 5034.4             |
| Jan 24, 2020 16:00:00 - Feb 14, 2020 23:00:00 | 512 hours (~21 days)        | 511                      | Hourly               | 4831.7             |
| Jan 24, 2020 16:00:00 - Feb 04, 2020 07:00:00 | 256 hours (~10 days)        | 255                      | Hourly               | 4680.8             |
| Feb 02, 2020 12:00:00 - Feb 04, 2020 08:59:00 | 2700 minutes (~44 hours)    | 2699                     | Minutely             | 4618.8             |
| Feb 03, 2020 12:00:00 - Feb 04, 2020 09:39:00 | 1300 minutes (~21 hours)    | 1299                     | Minutely             | 4326.7             |
| Feb 04, 2020 18:00:00 - Feb 04, 2020 22:49:00 | 650 minutes (~10 hours)     | 649                      | Minutely             | 4185.1             |

*There seems to consistently be one fewer point than expected. This could be either human calculation error or the boundary timestamps are not included.

**Based on the elapsed time of the request, the data was actually read from the hourly view.

## Observations

- Time to load data is not linearly proportionate to amount of data to load even within the same view
- Reading from a view is significantly slower than reading from either a materialized view or directly from a table
- Increase in space consumed may be beneficial depending on the underlying data resolution
- Though not recorded here, we observed a somewhat **linear** increase in time depending on the **amount of data** in the database.



## Case analysis on trade-off between materializing view and speed of hourly readings

**NOTE:** OED only contains reading data for 1 meter

**Underlying data:** 1-Minute Data for 1 year

**Space without materialized hourly view:** 218.9 MB

**Space with materialize hourly view:** 219.7 MB

**Changes to db**: We materialized the hourly view and modify the sql to read from the readings table (raw readings) instead of the minutely view.

| Interval                                      | Before changes (ms)* | After changes (ms) |
| --------------------------------------------- | -------------------- | ------------------ |
| Jan 01, 2020 00:00:00 - Apr 15, 2020 00:00:00 | 84.7                 | 101.6              |
| Jan 01, 2020 00:00:00 - Feb 22, 2020 00:00:00 | 78.6                 | 96.7               |
| Jan 01, 2020 00:00:00 - Feb 19, 2020 00:00:00 | 4982.8               | 206.2              |
| Jan 03, 2020 08:00:00 - Feb 14, 2020 23:00:00 | 5034.4               | 165.2              |
| Jan 24, 2020 16:00:00 - Feb 14, 2020 23:00:00 | 4831.7               | 122.3              |
| Jan 24, 2020 16:00:00 - Feb 04, 2020 07:00:00 | 4680.8               | 107.2              |
| Feb 02, 2020 12:00:00 - Feb 04, 2020 08:59:00 | 4618.8               | 431.3              |
| Feb 02, 2020 12:00:00 - Feb 04, 2020 09:39:00 | 4326.7               | 284.4              |
| Feb 02, 2020 12:00:00 - Feb 04, 2020 22:49:00 | 4185.1               | 211.9              |

*Data taken from default OED

## Remaining Work

- Closely check the impact on size of materialized view. When does size become an issue? The space data up by an empty is 57.3 MB.
- (Edge case) Test on load large years of data on first load (i.e. 10 years of data)
- Test on other reading frequencies (23-minute, daily, etc...). We do not expect to see significant differences. 
- Test of time it takes to refresh hourly readings.
- Test an intelligent db pulling strategy that takes into account the expected length of readings and max/expected reading length variations or if data is prone to holes (unlikely?).
  - Potentially check if the estimated number of data points in a interval is less than the number of points for a view, then load because it doesn't otherwise make sense to use the view when there is less data in the table.
  - If there is more data in the table, check if the ratio between points in the table to points that would be produced by the view is significant (< 2?), then it may be better to load from table for reasons....

## Problems Experienced

Error loading 23-minute data: Bug with some startTimeStamps not being after the previous readings endTimeStamps. Error message pop-up is displayed below. The same bug was experienced with the loading the autogenerated 1-minute test data, but there were fewer such reading start-time errors to correct. However, even after correct these bugs the log file indicates that warnings with issues of inconsistent time-lengths.

```bash
<h1>FAILURE</h1><h2>It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):</h2><br>For meter 23MinuteData: Warning parsing Reading #4200. Reading value gives 0.6080742447509084 with warning message:<br>The previous reading has a different time length than the current reading and exceeds the tolerance of 0 seconds. Note this is treated only as a warning since this may be expected for certain meters.<br>For reading #4200 on meter 23MinuteData in pipeline: previous reading has value 0.6093555568308412 start time 2020-03-08T01:14:00+00:00 end time 2020-03-08T01:37:00+00:00 and current reading has value 0.6080742447509084 start time 2020-03-08T01:37:00+00:00 end time 2020-03-08T03:00:00+00:00 with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter 23MinuteData: Warning parsing Reading #4201. Reading value gives 0.6067927678700015 with warning message:<br>The previous reading has a different time length than the current reading and exceeds the tolerance of 0 seconds. Note this is treated only as a warning since this may be expected for certain meters.<br>For reading #4201 on meter 23MinuteData in pipeline: previous reading has value 0.6080742447509084 start time 2020-03-08T01:37:00+00:00 end time 2020-03-08T03:00:00+00:00 and current reading has value 0.6067927678700015 start time 2020-03-08T03:00:00+00:00 end time 2020-03-08T03:23:00+00:00 with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter 23MinuteData: Error parsing Reading #19099. Reading value gives 0.009398868760731038 with error message:<br>The reading end time is not after the start time so we must drop the reading.<br>For reading #19099 on meter 23MinuteData in pipeline: previous reading has value 0.009169579319413868 start time 2020-11-01T01:31:00+00:00 end time 2020-11-01T01:54:00+00:00 and current reading has value 0.009169579319413868 start time 2020-11-01T01:31:00+00:00 end time 2020-11-01T01:54:00+00:00 with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter 23MinuteData: Warning parsing Reading #19100. Reading value gives 0.009031387043177297 with warning message:<br>The current reading startTime is not after the previous reading's end time. Note this is treated only as a warning since readings may be sent out of order.<br>There is a gap in time between this reading and the previous reading that exceeds the allowed amount of 0 seconds.<br>For reading #19100 on meter 23MinuteData in pipeline: previous reading has value 0.009169579319413868 start time 2020-11-01T01:31:00+00:00 end time 2020-11-01T01:54:00+00:00 and current reading has value 0.009031387043177297 start time 2020-11-01T01:17:00+00:00 end time 2020-11-01T01:40:00+00:00 with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter 23MinuteData: Error parsing Reading #19101. Reading value gives 0.00925896680924243 with error message:<br>The reading end time is not after the start time so we must drop the reading.<br>For reading #19101 on meter 23MinuteData in pipeline: previous reading has value 0.009031387043177297 start time 2020-11-01T01:17:00+00:00 end time 2020-11-01T01:40:00+00:00 and current reading has value 0.009031387043177297 start time 2020-11-01T01:17:00+00:00 end time 2020-11-01T01:40:00+00:00 with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><br>For meter 23MinuteData: Warning parsing Reading #19102. Reading value gives 0.010103579472941826 with warning message:<br>There is a gap in time between this reading and the previous reading that exceeds the allowed amount of 0 seconds.<br>For reading #19102 on meter 23MinuteData in pipeline: previous reading has value 0.009031387043177297 start time 2020-11-01T01:17:00+00:00 end time 2020-11-01T01:40:00+00:00 and current reading has value 0.010103579472941826 start time 2020-11-01T02:03:00+00:00 end time 2020-11-01T02:26:00+00:00 with timeSort increasing; duplications 1; cumulative false; cumulativeReset false; cumulativeResetStart 00:00:00; cumulativeResetEnd 23:59:59.999999; lengthGap 0; lengthVariation 0; onlyEndTime false<br><h2>Readings Dropped and should have previous messages</h2><ol><li>Dropped Reading #19099 for meter 23MinuteData</li><li>Dropped Reading #19101 for meter 23MinuteData</li></ol>
```



###### tags: `OED`