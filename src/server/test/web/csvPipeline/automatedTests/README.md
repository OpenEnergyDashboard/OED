# Automated pipeline testing files

See the original manual testing files for the script and README that gives more information on these tests.

**Note there are new tests in the manual file that are not in this file. They should be incorporated and the file names modified to fit this scheme.**

## Tests with one input file of readings

The input file will be pipe#Input.csv and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected.

| number | manual test ID | Descending time | Cumulative | Cumulative reset | Reading length variation | Reading gap | Duplication | End only | Description |
| :----: | :----------:   | :-------------: | :--------: | :--------------: | :----------------------: | :---------: | :---------: | :------: | :---------: |
| 1      | pipe1          |                 |            |                  |                          |             |             |          | Normal 1-5 values |
| 2      | pipe2          |  X              |            |                  |                          |             |             |          | Decreasing time for readings but expect usual values. |
| 3      | pipe3          |                 |     X      |                  |                          |             |             |          | Drops 1<sup>st</sup> reading as expected |
| 4      | pipe33         |  X              |     X      |                  |                          |             |             |          | Decreasing in time. Drops 1<sup>st</sup> reading as expected. |
| 5      | pipe4          |                 |     X      | Default          |                          |             |             |          | Drops 1<sup>st</sup> reading as expected |
| 6      | pipe5          |                 |     X      | 23:45-00:15      |                          |             |             |          | Same as above but explicit reset times and backward for start/end |
| 7      | pipe6          |                 |     X      | 11:45-12:15      |                          |             |             |          | Similar to above but reset times wrong so reading 4 wrong and drops all readings; forward for start/end reset |
| 8      | pipe7          |                 |     X      | 00:00-00:00.001  |                          |             |             |          | Same as second midnight above above but reset times tight so see all but first value |
| 9      | pipe8          |                 |     X      |                  |                          |             |             |          | Make sure rejects all readings if reset not indicated where reading 4 causes issue. |
| 10     | pipe9          |                 |     X      | Default          |                          |             |             |          | Allows reset at any time so all but first value. |
| 11     | pipe10         |                 |     X      |                  |                          |             |             |          | Make sure rejects all readings if reset not indicated where reading 4 is the issue |
| 12     | pipe11         |                 |     X      | 11:45-12:15      |                          |             |             |          | explicit reset times and forward for start/end so same as 2 above where all but first. |
| 13     | pipe12         |                 |     X      | 23:45-00:15      |                          |             |             |          | reset times wrong and backward for start/end so should have no values where reading 4 is issue |
| 14     | pipe13         |                 |            |                  | Default                  |             |             |          | Time varies by 1 & 2 min; All but 1<sup>st</sup> point vary slightly in reading due to time variation  – get low, high, high, low as expected; should get 4 warnings for line 2-5 |
| 15     | pipe14         |                 |            |                  | 60                       |             |             |          | Time varies by 1 & 2 min and allow 1 min (60 sec); Should warn about lines 3, 5. Same values as above. |
| 16     | pipe15         |                 |            |                  | 120                      |             |             |          | Time varies by 1 & 2 min; Should warn about line 5. Same values as above. |
| 17     | pipe16         |                 |            |                  | 121                      | Default     |             |          | Should get warning for lines 2 & 4. Length variation so no warnings about that. Point 2 & 4 should be slightly high since shorter length. |
| 18     | pipe17         |                 |            |                  | 121                      | 60          |             |          | Similar to above but now only warning for line 4. |
| 19     | pipe18         |                 |            |                  | 121                      | 120         |             |          | Similar to above but no warnings. |
| 20     | pipe19         |                 |     X      |                  |                          |             |             |          | Check header. Get standard cum values. |
| 21     | pipe21         |                 |     X      |                  |                          |             | 3           |          | Repeat every reading 3x but should only see once.  Get standard cum values. |
| 22     | pipe22         |                 |     X      | Default          |                          |             |             |          | Negative reading on #4 with cumulative so should get no reading. |
| 23     | pipe35         |                 |            |                  |                          |             |             |  X       | Must drop first value in end only so looks like regular cumulative values. |
| 24     | pipe36         |  X              |            |                  |                          |             |             |  X       | Must drop first value in end only so looks like regular cumulative values.|
| 25     | pipe37         |  X              |     X      |                  |                          |             |             |  X       | Normal cumulative values but get two message since drop first reading because cumulative & end only. |
| 26     | pipe43         |                 |            |                  |                          |             |             |          | The second reading start time is invalid so errors on that one and no readings. |
| 27     | pipe44         |                 |            |                  |                          |             |             |          | The second reading end time is invalid so errors on that one and no readings. |
| 28     | pipe45         |                 |            |                  |                          |             |             |          | Uses various valid formats to make sure work. Should get usual ascending values. |
| 29     | pipe46         |                 |     X      |                  |                          |             |             |          | The first three readings try various number formats that are fine then the fourth reading has an invalid reading number so error where all readings are rejected. |
| 30     | pipe47         |                 |            |                  |                          |             |             |          | The first three readings try various number formats that are fine then the fourth reading has an invalid reading number so error where all readings are rejected. |
| 31     | pipe48         |                 |            |                  | 121                      | Default     |             |          | This is similar to pipe16 with gaps but here it is an error since cumulative data. Should get error for lines 2 & 4 and dropped. Length variation so no warnings about that. Only get readings 3 & 5. |
| 32     | pipe49         |                 |     X      |                  |                          |             |             |          | The second reading has the start time before the first reading's end time so it is rejected. There is also a warning about reading #3 since reading #2 had a different length. Should see readings 3-5. |
| 33     | pipe50         |                 |     X      |                  |                          |             |             |          | The third reading has a negative value so all readings rejected. |
| 34     | pipe51         |                 |            |                  |                          |             |             |          | The second reading has start and end time the same so length is zero and the reading is rejected. Also get gap warning on reading three since 2nd was wrong. Expect to have readings 1 & 3-5.|
| 35     | pipe52         |                 |            |                  |                          |             |             |  X       | The second reading has end time that is same as the first reading's end time and the reading is rejected. In end only data you use the previous to get the current start so the reading spans no time. Also get length warning on reading three since 2nd was wrong. Also get warning length on reading #4 since #3 was messed up. Expect to have readings 3-5. |

## Tests with one input file that is gzipped of readings

The input file will be pipe#Input.csv.gz and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected.

| number | manual test ID | Descending time | Cumulative | Cumulative reset | Reading length variation | Reading gap | Duplication | End only | Description |
| :----: | :----------:   | :-------------: | :--------: | :--------------: | :----------------------: | :---------: | :---------: | :------: | :---------: |
| 40     | pipe20         |                 | X          |                  |                          |             |             |          | Check gzip (with header). Get standard cum values. |

## Tests with two input files of readings

The input neter file will be pipe#AInput.csv & pipe#BInput.csv and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected.

| number | manual test ID | Descending time | Cumulative | Cumulative reset | Reading length variation | Reading gap | Duplication | End only | Description |
| :----: | :----------:   | :-------------: | :--------: | :--------------: | :----------------------: | :---------: | :---------: | :------: | :---------: |
| 50     | pipe38         |                 |            |                  |                          |             |             |          | Do second insert with update where change value 1 to 1.5 and 5 to 5.5 and insert new value 0 a day earlier and 6 a day later. Should get 0, 1.5, 2, 3, 4, 5.5, 6. |
| 51     | pipe39         |                 |            |                  |                          |             |             |          | Do second insert without update where change value 1 to 1.5 and 5 to 5.5 and insert new value 0 a day earlier and 6 a day later. The updates to 1.5 and 5.5 should not happen but new values should appear. Should get 0-6. |
| 52     | pipe24         |                 | X          | Default          |                          |             |             |          | Add two more values via second curl but this time the second one involves a reset. Expect normal cum readings plus 6 & 7. |

## Tests with three input files of readings

The input neter file will be pipe#AInput.csv, pipe#BInput.csv & pipe#CInput.csv and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected.

| number | manual test ID | Descending time | Cumulative | Cumulative reset | Reading length variation | Reading gap | Duplication | End only | Description |
| :----: | :----------:   | :-------------: | :--------: | :--------------: | :----------------------: | :---------: | :---------: | :------: | :---------: |
| 60     | pipe23         |                 | X          |                  |                          |             |             |          |     Add in cumulative readings via two more uploads of a single value. Expect normal cum readings plus 6 & 7. |

## Tests with two input files of first meter and then readings

The input neter file will be pipe#AInputMeter.csv, the input readings file will be pipe#BInput.csv and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected. The meter values should also be tested.

| number | manual test ID | Descending time | Cumulative | Cumulative reset | Reading length variation | Reading gap | Duplication | End only | Description |
| :----: | :----------:   | :-------------: | :--------: | :--------------: | :----------------------: | :---------: | :---------: | :------: | :---------: |
| 70     | pipe27         |                 | X          |                  |                          |             |             |          |     The meter in DB is set to cumulative, cumulative_reset to true & reset range is 11:45-12:15 but not sent via curl. This and following ones test that you can create a meter with various values set. The reset value should be reject row 4 since negative and no readings for meter. |
| 71     | pipe28         |                 | X          |                  |                          |             |             |          |     The meter in DB is set to cumulative, cumulative_reset to true & reset range is 11:45-12:15 but then sent via curl so should reset around midnight. Should get usual cumulative values. |
| 72     | pipe29         |                 |            |                  |                          |             |             |          |     The meter in DB is set to reading_gap=60 and reading_variation=120. Should get warning for gap for line 4 and Length variation for line 5. Expect 1, 2+, 3, 4+, 5-, 5- (same as previous point and extra one since last reading goes into next day) |
 | 73    | pipe30         |                 |            |                  |                          |             |             |          |     The meter in DB is set to reading_gap=60 and reading_variation=120 but then the curl passes 120.1 and 121.2 for gap & variation. Should get Length variation for line 5. Expect 1, 2+, 3, 4+, 5-, 5- (same as previous point and extra one since last reading goes into next day). This also checks that floating point numbers come through correctly by seeing message has correct value.
 | 74    | pipe31         |                 | X          |                  |                          |             | 3           |          |     The meter in DB is set to reading_duplication=3 and no value in curl. Repeat every reading 3x but should only see once.  Get standard cum values. |
 | 75    | pipe32         |  X              |            |                  |                          |             |             |          |     The meter in DB is set to time_sort='decreasing' and no value in curl. Should get usual values. |
 | 76    | pipe34         |                 |            |                  |                          |             |             | X        |     The meter in DB is set to end_only_time='true' and no value in curl. Should get usual values with first one dropped. |

## Tests with multiple input files of first two meter and then readings

The two input neter files will be pipe#AInputMeter.csv & pipe#BInputMeter.csv, the input readings file will be pipe#CInput.csv and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected. The meter values should also be tested.

| number | manual test ID | Descending time | Cumulative | Cumulative reset | Reading length variation | Reading gap | Duplication | End only | Description |
| :----: | :----------:   | :-------------: | :--------: | :--------------: | :----------------------: | :---------: | :---------: | :------: | :---------: |
| 80     | pipe25         |                 | X          |                  |                          |             |             |          | The meter in DB is set to cumulative via second curl. Also tests update without header. Expect usual cumulative values. |

## Tests with two input files of meters that are gzipped meters and then readings

The input meter file will be pipe#AInputMeter.csv.gz & pipe#BInputMeter.csv.gz, the input readings file will be pipe#CInput.csv and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected. The meter values should also be tested.

| number | manual test ID | Descending time | Cumulative | Cumulative reset | Reading length variation | Reading gap | Duplication | End only | Description |
| :----: | :----------:   | :-------------: | :--------: | :--------------: | :----------------------: | :---------: | :---------: | :------: | :---------: |
| 90     | pipe26         |                 | X          |                  |                                        |             |          |     The meter in DB is set to cumulative & cumulative_reset but not sent via curl. Checks creating and updating meter with gzip file and header. Expect usual cumulative values. |

## Tests with one input file of meters

The input file will be pipe#InputMeter.csv. The meter values must be tested.

| number | manual test ID | Descending time | Cumulative | Cumulative reset | Reading length variation | Reading gap | Duplication | End only | Description |
| :----: | :----------:   | :-------------: | :--------: | :--------------: | :----------------------: | :---------: | :---------: | :------: | :---------: |
| 100    | pipe40         |                 |            |                  |                          |             |             |          | Give update name as parameter when more than one row in CSV on second one. All updates should be rejected with error. Original meter creation should give meters pipe40 and pipe40b. pipe40 sets note to note40, area to 13, reading to 17, start time to 1111-11-10 11:11:11 and end time to 1111-11-11 11:11:11 to test setting these values since not done before. |
| 101    | pipe41         |                 |            |                  |                          |             |             |          | File has two meters to insert where second is same name so should be rejected. Only see meter pipe41 with same values as last one. |
| 102    | pipe42         |                 |            |                  |                          |             |             |          | Update of meter but name does not exist |
