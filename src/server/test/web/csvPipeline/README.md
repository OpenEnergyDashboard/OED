# Automated pipeline testing files

## Tests with one input file of readings

The input file will be pipe#Input.csv and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected.

| Pipe   | Descending time | Cumulative | Cumulative reset | Reading length variation | Reading gap | Duplication | End only | Description |
| :----: | :-------------: | :--------: | :--------------: | :----------------------: | :---------: | :---------: | :------: | :---------: |
| 1      |                 |            |                  |                          |             |             |          | Normal 1-5 values |
| 2      | X               |            |                  |                          |             |             |          | Decreasing time for readings but expect usual values. |
| 3      |                 | X          |                  |                          |             |             |          | Drops 1<sup>st</sup> reading as expected |
| 4      | X               | X          |                  |                          |             |             |          | Decreasing in time. Drops 1<sup>st</sup> reading as expected. |
| 5      |                 | X          | Default          |                          |             |             |          | Drops 1<sup>st</sup> reading as expected |
| 6      |                 | X          | 23:45-00:15      |                          |             |             |          | Same as above but explicit reset times and backward for start/end |
| 7      |                 | X          | 11:45-12:15      |                          |             |             |          | Similar to above but reset times wrong so reading 4 wrong and drops all readings; forward for start/end reset |
| 8      |                 | X          | 00:00-00:00.001  |                          |             |             |          | Same as second midnight above above but reset times tight so see all but first value |
| 9      |                 | X          |                  |                          |             |             |          | Make sure rejects all readings if reset not indicated where reading 4 causes issue. |
| 10     |                 | X          | Default          |                          |             |             |          | Allows reset at any time so all but first value. |
| 11     |                 | X          |                  |                          |             |             |          | Make sure rejects all readings if reset not indicated where reading 4 is the issue |
| 12     |                 | X          | 11:45-12:15      |                          |             |             |          | explicit reset times and forward for start/end so same as 2 above where all but first. |
| 13     |                 | X          | 23:45-00:15      |                          |             |             |          | reset times wrong and backward for start/end so should have no values where reading 4 is issue |
| 14     |                 |            |                  | Default                  |             |             |          | Time varies by 1 & 2 min; All but 1<sup>st</sup> point vary slightly in reading due to time variation  – get low, high, high, low as expected; should get 4 warnings for line 2-5 |
| 15     |                 |            |                  | 60                       |             |             |          | Time varies by 1 & 2 min and allow 1 min (60 sec); Should warn about lines 3, 5. Same values as above. |
| 16     |                 |            |                  | 120                      |             |             |          | Time varies by 1 & 2 min; Should warn about line 5. Same values as above. |
| 17     |                 |            |                  | 121                      | Default     |             |          | Should get warning for lines 2 & 4. Length variation so no warnings about that. Point 2 & 4 should be slightly high since shorter length. |
| 18     |                 |            |                  | 121                      | 60          |             |          | Similar to above but now only warning for line 4. |
| 19     |                 |            |                  | 121                      | 120         |             |          | Similar to above but no warnings. |
| 20     |                 | X          |                  |                          |             |             |          | Check header. Get standard cum values. |
| 21     |                 | X          |                  |                          |             | 3           |          | Repeat every reading 3x but should only see once.  Get standard cum values. |
| 22     |                 | X          | Default          |                          |             |             |          | Negative reading on #4 with cumulative so should get no reading. |
| 23     |                 |            |                  |                          |             |             | X        | Must drop first value in end only so looks like regular cumulative values. |
| 24     | X               |            |                  |                          |             |             | X        | Must drop first value in end only so looks like regular cumulative values.|
| 25     | X               | X          |                  |                          |             |             | X        | Normal cumulative values but get two message since drop first reading because cumulative & end only. |
| 26     |                 |            |                  |                          |             |             |          | The second reading start time is invalid so errors on that one and no readings. |
| 27     |                 |            |                  |                          |             |             |          | The second reading end time is invalid so errors on that one and no readings. |
| 29     |                 | X          |                  |                          |             |             |          | The first three readings try various number formats that are fine then the fourth reading has an invalid reading number so error where all readings are rejected. |
| 30     |                 |            |                  |                          |             |             |          | The first three readings try various number formats that are fine then the fourth reading has an invalid reading number so error where all readings are rejected. |
| 31     |                 |            |                  | 121                      | Default     |             |          | This is similar to pipe16 with gaps but here it is an error since cumulative data. Should get error for lines 2 & 4 and dropped. Length variation so no warnings about that. Only get readings 3 & 5. |
| 32     |                 | X          |                  |                          |             |             |          | The second reading has the start time before the first reading's end time so it is rejected. There is also a warning about reading #3 since reading #2 had a different length. Should see readings 3-5. |
| 33     |                 | X          |                  |                          |             |             |          | The third reading has a negative value so all readings rejected. |
| 34     |                 |            |                  |                          |             |             |          | The second reading has start and end time the same so length is zero and the reading is rejected. Also get gap warning on reading three since 2nd was wrong. Expect to have readings 1 & 3-5.|
| 35     |                 |            |                  |                          |             |             | X        | The second reading has end time that is same as the first reading's end time and the reading is rejected. In end only data you use the previous to get the current start so the reading spans no time. Also get length warning on reading three since 2nd was wrong. Also get warning length on reading #4 since #3 was messed up. Expect to have readings 3-5. |

## Tests with one input file that is gzipped of readings

The input file will be pipe#Input.csv.gz and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected.

| number | Descending time | Cumulative | Cumulative reset | Reading length variation | Reading gap | Duplication | End only | Description |
| :----: | :-------------: | :--------: | :--------------: | :----------------------: | :---------: | :---------: | :------: | :---------: |
| 40     |                 | X          |                  |                          |             |             |          | Check gzip (with header). Get standard cum values. |

## Tests with two input files of readings

The input meter file will be pipe#AInput.csv & pipe#BInput.csv and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected.

| Pipe   | Descending time | Cumulative | Cumulative reset | Reading length variation | Reading gap | Duplication | End only | Description |
| :----: | :-------------: | :--------: | :--------------: | :----------------------: | :---------: | :---------: | :------: | :---------: |
| 50     |                 |            |                  |                          |             |             |          | Do second insert with update where change value 1 to 1.5 and 5 to 5.5 and insert new value 0 a day earlier and 6 a day later. Should get 0, 1.5, 2, 3, 4, 5.5, 6. |
| 51     |                 |            |                  |                          |             |             |          | Do second insert without update where change value 1 to 1.5 and 5 to 5.5 and insert new value 0 a day earlier and 6 a day later. The updates to 1.5 and 5.5 should not happen but new values should appear. Should get 0-6. |
| 52     |                 | X          | Default          |                          |             |             |          | Add two more values via second curl but this time the second one involves a reset. Expect normal cum readings plus 6 & 7. |

## Tests with three input files of readings

The input meter file will be pipe#AInput.csv, pipe#BInput.csv & pipe#CInput.csv and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected.

| Pipe   | Descending time | Cumulative | Cumulative reset | Reading length variation | Reading gap | Duplication | End only | Description |
| :----: | :-------------: | :--------: | :--------------: | :----------------------: | :---------: | :---------: | :------: | :---------: |
| 60     |                 | X          |                  |                          |             |             |          |     Add in cumulative readings via two more uploads of a single value. Expect normal cum readings plus 6 & 7. |

## Tests with two input files of first meter and then readings

The input meter file will be pipe#AInputMeter.csv, the input readings file will be pipe#BInput.csv and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected. The meter values should also be tested.

| Pipe   | Descending time | Cumulative | Cumulative reset | Reading length variation | Reading gap | Duplication | End only | Description |
| :----: | :-------------: | :--------: | :--------------: | :----------------------: | :---------: | :---------: | :------: | :---------: |
| 70     |                 | X          |                  |                          |             |             |          |     The meter in DB is set to cumulative, cumulative_reset to true & reset range is 11:45-12:15 but not sent via curl. This and following ones test that you can create a meter with various values set. The reset value should be reject row 4 since negative and no readings for meter. |
| 71     |                 | X          |                  |                          |             |             |          |     The meter in DB is set to cumulative, cumulative_reset to true & reset range is 11:45-12:15 but then sent via curl so should reset around midnight. Should get usual cumulative values. |
| 72     |                 |            |                  |                          |             |             |          |     The meter in DB is set to reading_gap=60 and reading_variation=120. Should get warning for gap for line 4 and Length variation for line 5. Expect 1, 2+, 3, 4+, 5-, 5- (same as previous point and extra one since last reading goes into next day) |
 | 73    |                 |            |                  |                          |             |             |          |     The meter in DB is set to reading_gap=60 and reading_variation=120 but then the curl passes 120.1 and 121.2 for gap & variation. Should get Length variation for line 5. Expect 1, 2+, 3, 4+, 5-, 5- (same as previous point and extra one since last reading goes into next day). This also checks that floating point numbers come through correctly by seeing message has correct value.
 | 74    |                 | X          |                  |                          |             | 3           |          |     The meter in DB is set to reading_duplication=3 and no value in curl. Repeat every reading 3x but should only see once.  Get standard cum values. |
 | 75    | X               |            |                  |                          |             |             |          |     The meter in DB is set to time_sort='decreasing' and no value in curl. Should get usual values. |
 | 76    |                 |            |                  |                          |             |             | X        |     The meter in DB is set to end_only_time='true' and no value in curl. Should get usual values with first one dropped. |

## Tests with multiple input files of first two meter and then readings

The two input meter files will be pipe#AInputMeter.csv & pipe#BInputMeter.csv, the input readings file will be pipe#CInput.csv and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected. The meter values should also be tested.

| Pipe   |  Descending time | Cumulative | Cumulative reset | Reading length variation | Reading gap | Duplication | End only | Description |
| :----: |:-------------: | :--------: | :--------------: | :----------------------: | :---------: | :---------: | :------: | :---------: |
| 80     |                 | X          |                  |                          |             |             |          | The meter in DB is set to cumulative via second curl. Also tests update without header. Expect usual cumulative values. |

## Tests with two input files of meters that are gzipped meters and then readings

The input meter file will be pipe#AInputMeter.csv.gz & pipe#BInputMeter.csv.gz, the input readings file will be pipe#CInput.csv and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected. The meter values should also be tested.

| Pipe   | Descending time | Cumulative | Cumulative reset | Reading length variation | Reading gap | Duplication | End only | Description |
| :----: | :-------------: | :--------: | :--------------: | :----------------------: | :---------: | :---------: | :------: | :---------: |
| 90     |                 | X          |                  |                                        |             |          |     The meter in DB is set to cumulative & cumulative_reset but not sent via curl. Checks creating and updating meter with gzip file and header. Expect usual cumulative values. |

## Tests with one input file of meters

The input file will be pipe#InputMeter.csv. The meter values must be tested.

| Pipe   | Descending time | Cumulative | Cumulative reset | Reading length variation | Reading gap | Duplication | End only | Description |
| :----: | :-------------: | :--------: | :--------------: | :----------------------: | :---------: | :---------: | :------: | :---------: |
| 100    |                 |            |                  |                          |             |             |          | Give update name as parameter when more than one row in CSV on second one. All updates should be rejected with error. Original meter creation should give meters pipe40 and pipe40b. pipe40 sets note to note40, area to 13, reading to 17, start time to 1111-11-10 11:11:11 and end time to 1111-11-11 11:11:11 to test setting these values since not done before. |
| 101    |                 |            |                  |                          |             |             |          | File has two meters to insert where second is same name so should be rejected. Only see meter pipe41 with same values as last one. |
| 102    |                 |            |                  |                          |             |             |          | Update of meter but name does not exist |

## Tests daylight savings with meter and readings file

| Pipe   | Descending time | Cumulative | Cumulative reset | Reading length variation | Reading gap | Duplication | End only | Description |
| :----: | :-------------: | :--------: | :--------------: | :----------------------: | :---------: | :---------: | :------: | :---------: |
| 110    | daylightForwardHourlyCT & meterPipe53 | pipe53 |  | | |  |  | | | The second reading crosses into DST and has time adjusted. The readings are 60/0-1, 120/1-2, 180/3-4.
| 111    | daylightForwardDailyCT & meterPipe54 | pipe54 |  | | |  |  | | | The second reading crosses into DST and must be split. The readings are 1440/03-13 0-0, 240/03-13 0-2, 2520/03-13 3-0, 4320/03-14 0-0.
| 112    | daylightForward15MinCT & meterPipe55 | pipe55 |  | | |  |  | | | The second reading crosses into DST and has time adjusted. The readings are 15/1:30-1:45, 30/1:45-2:00, 45/3:00-3:15.
| 113    | daylightForward23MinCT & meterPipe56 | pipe56 |  | | |  |  | | | The second reading crosses into DST and must be split. The readings are 23/1:23-1:46, 28/1:46-2:00, 18/3:00-3:09, 69/3:09-3:32.
| 114    | daylightForward23MinCumulativeCT & meterPipe57 | pipe57 |  | X| |  |  | | | The second reading crosses into DST and must be split and cumulative. The readings are 23/1:23-1:46, 28/1:46-2:00, 18/3:00-3:09, 69/3:09-3:32.
| 115    | daylightForward23MinEndCT & meterPipe58 | pipe58 |  | | |  |  | | X | The second reading crosses into DST and must be split and end only. The readings are 23/1:23-1:46, 28/1:46-2:00, 18/3:00-3:09, 69/3:09-3:32.
| 116    | daylightBackwardHourlyCT & meterPipe59 | pipe59 |  | | |  |  | | | The second reading crosses from DST and must be dropped. The readings are 60/0-1, 120/1-2.
| 117    | daylightBackwardDailyCT & meterPipe60 | pipe60 |  | | |  |  | | | The second reading crosses from DST and must be prorated. The readings are 1440/11-05, 2880/11-06, 4320/11-07.
| 118    | daylightBackward15MinCT & meterPipe61 | pipe61 |  | | |  |  | | | The second reading crosses from DST and must be dropped. Readings 3-5 are also dropped. The readings are 15/1:30-1:45, 30/1:45-2:00, 45/2:00-2:15.
| 119    | daylightBackward23MinCT & meterPipe62 | pipe62 |  | | |  |  | | | The second reading crosses from DST and must be dropped. Readings 3 is also dropped. Reading 4 must be split. The readings are 23/1:23-1:46, 18/1:46-1:55, 69/1:55-2:18, 92/2:18-2:41.
| 120    | daylightBackward23MinCumulativeCT & meterPipe63 | pipe63 |  | X| |  |  | | | Reading are cumulative. The first reading dropped for cumulate. The third reading crosses from DST and must be dropped. Reading 4 is dropped since inside BST. Reading 5 must be split. The readings are 23/1:23-1:46, 18/1:46-1:55, 69/1:55-2:18, 92/2:18-2:41.
| 121    | daylightBackward23MinEndCT & meterPipe64 | pipe64 |  | | |  |  | | X | Reading are end only. The first reading dropped for end only. The second reading crosses from DST and must be dropped. Readings 3 is also dropped. Reading 4 must be split. The readings are 23/1:23-1:46, 18/1:46-1:55, 69/1:55-2:18, 92/2:18-2:41.
| 122    | daylightBackward23MinEndACT & daylightBackward23MinEndBCT & meterPipe65 | pipe65 |  | | |  |  | | X | Reading are end only but split into two files exactly when first hits the DST crossing. The first reading of the first file must be dropped for end only. The third reading of the first file crosses from DST and must be dropped. The first reading of file two is also dropped. Reading 2 of the second file must be split. The readings are 23/1:23-1:46, 18/1:46-1:55, 69/1:55-2:18, 92/2:18-2:41.
| 123    | daylightBackwardGapCT & meterPipe66 | pipe66 |  | | |  |  | | | The second reading is after crossing but due to a gap the crossing is not seen. A warning is issued and two readings overlap. The readings are 15/1:25-1:55, 30/1:30-2:00, 45/2:00-2:30. |
