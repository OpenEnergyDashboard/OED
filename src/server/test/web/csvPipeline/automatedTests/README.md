# Automated pipeline testing files

See the original manual testing files for the script and README that gives more information on these tests.

## Tests with one input file of readings

The input file will be pipe#Input.csv and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected.

<table>
  <tr>
   <td>number
   </td>
   <td>manual test ID
   </td>
   <td>Descending time
   </td>
   <td>Cumulative
   </td>
   <td>Cumulative reset
   </td>
   <td>Reading length variation
   </td>
   <td>Reading gap
   </td>
   <td>Duplication
   </td>
   <td>End only
   </td>
   <td>Description
   </td>
  </tr>
  <tr>
   <td>1
   </td>
   <td>pipe1
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>Normal 1-5 values
   </td>
  </tr>
  <tr>
   <td>2
   </td>
   <td>pipe2
   </td>
   <td>X
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>Decreasing time for readings but expect usual values.
   </td>
  </tr>
  <tr>
   <td>3
   </td>
   <td>pipe3
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>Drops 1<sup>st</sup> reading as expected
   </td>
  </tr>
  <tr>
   <td>4
   </td>
   <td>pipe33
   </td>
   <td>X
   </td>
   <td>X
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>Decreasing in time. Drops 1<sup>st</sup> reading as expected.
   </td>
  </tr>
  <tr>
   <td>5
   </td>
   <td>pipe4
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>Default
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>Drops 1<sup>st</sup> reading as expected
   </td>
  </tr>
  <tr>
   <td>6
   </td>
   <td>pipe5
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>23:45-00:15
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>Same as above but explicit reset times and backward for start/end
   </td>
  </tr>
  <tr>
   <td>7
   </td>
   <td>pipe6
   </td>
   <td>
   </td>
   <td>x
   </td>
   <td>11:45-12:15
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>Similar to above but reset times wrong so reading 4 wrong and drops all readings; forward for start/end reset
   </td>
  </tr>
  <tr>
   <td>8
   </td>
   <td>pipe7
   </td>
   <td>
   </td>
   <td>x
   </td>
   <td>00:00-00:00.001
   </td>
   <td>
   </td>
   <td>
   <td>
  </td>
  </td>
   <td>
   </td>
    <td>Same as second midnight above above but reset times tight so see all but first value
   </td>
  </tr>
  <tr>
   <td>9
   </td>
   <td>pipe8
   </td>
   <td>
   </td>
   <td>x
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>Make sure rejects all readings if reset not indicated where reading 4 causes issue.
   </td>
  </tr>
  <tr>
   <td>10
   </td>
   <td>pipe9
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>Default
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>Allows reset at any time so all but first value.
   </td>
  </tr>
  <tr>
   <td>11
   </td>
   <td>pipe10
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>Make sure rejects all readings if reset not indicated where reading 4 is the issue
   </td>
  </tr>
  <tr>
   <td>12
   </td>
   <td>pipe11
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>11:45-12:15
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>explicit reset times and forward for start/end so same as 2 above where all but first.
   </td>
  </tr>
  <tr>
   <td>13
   </td>
   <td>pipe12
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>23:45-00:15
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>reset times wrong and backward for start/end so should have no values where reading 4 is issue
   </td>
  </tr>
  <tr>
   <td>14
   </td>
   <td>pipe13
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>Default
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>Time varies by 1 & 2 min; All but 1<sup>st</sup> point vary slightly in reading due to time variation  – get low, high, high, low as expected; should get 4 warnings for line 2-5
   </td>
  </tr>
  <tr>
   <td>15
   </td>
   <td>pipe14
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>60
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>Time varies by 1 & 2 min and allow 1 min (60 sec); Should warn about lines 3, 5. Same values as above.
   </td>
  </tr>
  <tr>
   <td>16
   </td>
   <td>pipe15
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>120
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>Time varies by 1 & 2 min; Should warn about line 5. Same values as above.
   </td>
  </tr>
  <tr>
   <td>17
   </td>
   <td>pipe16
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>121
   </td>
   <td>Default
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>Should get warning for lines 2 & 4. Length variation so no warnings about that. Point 2 & 4 should be slightly high since shorter length.
   </td>
  </tr>
  <tr>
   <td>18
   </td>
   <td>pipe17
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>121
   </td>
   <td>60
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>Similar to above but now only warning for line 4.
   </td>
  </tr>
  <tr>
   <td>19
   </td>
   <td>pipe18
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>121
   </td>
   <td>120
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>Similar to above but no warnings.
   </td>
  </tr>
  <tr>
   <td>20
   </td>
   <td>pipe19
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>Check header. Get standard cum values.
   </td>
 <tr>
   <td>21
   </td>
   <td>pipe21
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>3
   </td>
    <td>
   </td>
   <td>Repeat every reading 3x but should only see once.  Get standard cum values.
   </td>
  </tr>
  <tr>
   <td>22
   </td>
   <td>pipe22
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>Default
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>Negative reading on #4 with cumulative so should get no reading.
   </td>
  </tr>
<tr>
   <td>23
   </td>
   <td>pipe35
   </td>
   <td>
   </td>
   <td>
   <td>
   </td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>X
   </td>
   <td>Must drop first value in end only so looks like regular cumulative values.
   </td>
  </tr>
  <tr>
   <td>24
   </td>
   <td>pipe36
   </td>
   <td>X
   </td>
   <td>
   <td>
   </td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>X
   </td>
   <td>Must drop first value in end only so looks like regular cumulative values.
   </td>
  </tr>
  <tr>
  <td>25
  </td>
  <td>pipe37
   </td>
   <td>X
   </td>
   <td>X
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>X
   </td>
   <td>Normal cumulative values but get two message since drop first reading because cumulative & end only.
   </td>
  </tr>
   <tr>
   <td>26
   </td>
  <td>pipe43
   </td>
   <td>
   <td>
   </td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>The second reading start time is invalid so errors on that one and no readings.
   </td>
  </tr> <tr>
   <td>27
   </td>
  <td>pipe44
   </td>
   <td>
   <td>
   </td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>The second reading end time is invalid so errors on that one and no readings.
   </td>
  </tr> <tr>
   <td>28
   </td>
  <td>pipe45
   </td>
   <td>
   <td>
   </td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>Uses various valid formats to make sure work. Should get usual ascending values.
   </td>
  </tr>
<tr>
   <td>29
   </td>
   <td>pipe46
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>The first three readings try various number formats that are fine then the fourth reading has an invalid reading number so error where all readings are rejected.
   </td>
  </tr>
  tr>
   <td>30
   </td>
   <td>pipe47
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>The first three readings try various number formats that are fine then the fourth reading has an invalid reading number so error where all readings are rejected.
   </td>
  </tr>
  <tr>
   <td>31
   </td>
   <td>pipe48
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>121
   </td>
   <td>Default
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>This is similar to pipe16 with gaps but here it is an error since cumulative data. Should get error for lines 2 & 4 and dropped. Length variation so no warnings about that. Only get readings 3 & 5.
   </td>
  </tr>
  <tr>
   <td>32
   </td>
   <td>pipe49
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>The second reading has the start time before the first reading's end time so it is rejected. There is also a warning about reading #3 since reading #2 had a different length. Should see readings 3-5.
  </tr>
 <tr>
   <td>33
   </td>
   <td>pipe50
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>The third reading has a negative value so all readings rejected.
  </tr>
<tr>
   <td>34
   </td>
   <td>pipe51
   </td>
   <td>
   </td>
   <td>
   <td>
   </td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>The second reading has start and end time the same so length is zero and the reading is rejected. Also get gap warning on reading three since 2nd was wrong. Expect to have readings 1 & 3-5.
   </td>
   </tr>tr>
   <td>35
   </td>
   <td>pipe52
   </td>
   <td>
   </td>
   <td>
   <td>
   </td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>X
   </td>
   <td>The second reading has end time that is same as the first reading's end time and the reading is rejected. In end only data you use the previous to get the current start so the reading spans no time. Also get length warning on reading three since 2nd was wrong. Also get warning length on reading #4 since #3 was messed up. Expect to have readings 3-5.
   </td>
   </tr>
     </table>

## Tests with one input file that is gzipped of readings

The input file will be pipe#Input.csv.gz and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected.

<table>
  <tr>
   <td>number
   </td>
   <td>manual test ID
   </td>
   <td>Descending time
   </td>
   <td>Cumulative
   </td>
   <td>Cumulative reset
   </td>
   <td>Reading length variation
   </td>
   <td>Reading gap
   </td>
   <td>Duplication
   </td>
   <td>End only
   </td>
   <td>Description
   </td>
  </tr>
  </tr>
  <tr>
   <td>40
   </td>
   <td>pipe20
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>Check gzip (with header). Get standard cum values.
   </td>
  </tr>
 </table>

## Tests with two input files of readings

The input neter file will be pipe#AInput.csv & pipe#BInput.csv and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected.

<table>
  <tr>
   <td>number
   </td>
   <td>manual test ID
   </td>
   <td>Descending time
   </td>
   <td>Cumulative
   </td>
   <td>Cumulative reset
   </td>
   <td>Reading length variation
   </td>
   <td>Reading gap
   </td>
   <td>Duplication
   </td>
   <td>End only
   </td>
   <td>Description
   </td>
  </tr>
  <tr>
   <td>50
   </td>
   <td>pipe38
   </td>
   <td>
   </td>
   <td>
   <td>
   </td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>Do second insert with update where change value 1 to 1.5 and 5 to 5.5 and insert new value 0 a day earlier and 6 a day later. Should get 0, 1.5, 2, 3, 4, 5.5, 6.
   </td>
  </tr>
  <tr>
   <td>51
   </td>
   <td>pipe39
   </td>
   <td>
   </td>
   <td>
   <td>
   </td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>Do second insert without update where change value 1 to 1.5 and 5 to 5.5 and insert new value 0 a day earlier and 6 a day later. The updates to 1.5 and 5.5 should not happen but new values should appear. Should get 0-6.
   </td>
   </tr>
 <tr>
   <td>52
   </td>
   <td>pipe24
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>Default
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>Add two more values via second curl but this time the second one involves a reset. Expect normal cum readings plus 6 & 7.
   </td>
  </tr>
</table>

## Tests with three input files of readings

The input neter file will be pipe#AInput.csv, pipe#BInput.csv & pipe#CInput.csv and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected.

<table>
  <tr>
   <td>number
   </td>
   <td>manual test ID
   </td>
   <td>Descending time
   </td>
   <td>Cumulative
   </td>
   <td>Cumulative reset
   </td>
   <td>Reading length variation
   </td>
   <td>Reading gap
   </td>
   <td>Duplication
   </td>
   <td>End only
   </td>
   <td>Description
   </td>
  </tr>
  <tr>
   <td>60
   </td>
   <td>pipe23
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>Add in cumulative readings via two more uploads of a single value. Expect normal cum readings plus 6 & 7.
   </td>
  </tr>
</table>

## Tests with two input files of first meter and then readings

The input neter file will be pipe#AInputMeter.csv, the input readings file will be pipe#BInput.csv and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected. The meter values should also be tested.

<table>
  <tr>
   <td>number
   </td>
   <td>manual test ID
   </td>
   <td>Descending time
   </td>
   <td>Cumulative
   </td>
   <td>Cumulative reset
   </td>
   <td>Reading length variation
   </td>
   <td>Reading gap
   </td>
   <td>Duplication
   </td>
   <td>End only
   </td>
   <td>Description
   </td>
  </tr>
   <tr>
  <tr>
   <td>70
   </td>
   <td>pipe27
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>The meter in DB is set to cumulative, cumulative_reset to true & reset range is 11:45-12:15 but not sent via curl. This and following ones test that you can create a meter with various values set. The reset value should be reject row 4 since negative and no readings for meter.
   </td>
  </tr>
  <tr>
   <td>71
   </td>
   <td>pipe28
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>The meter in DB is set to cumulative, cumulative_reset to true & reset range is 11:45-12:15 but then sent via curl so should reset around midnight. Should get usual cumulative values.
   </td>
  </tr>
  <tr>
   <td>72
   </td>
   <td>pipe29
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>The meter in DB is set to reading_gap=60 and reading_variation=120. Should get warning for gap for line 4 and Length variation for line 5. Expect 1, 2+, 3, 4+, 5-, 5- (same as previous point and extra one since last reading goes into next day)
   </td>
  </tr>
 <tr>
   <td>73
   </td>
   <td>pipe30
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>The meter in DB is set to reading_gap=60 and reading_variation=120 but then the curl passes 120.1 and 121.2 for gap & variation. Should get Length variation for line 5. Expect 1, 2+, 3, 4+, 5-, 5- (same as previous point and extra one since last reading goes into next day). This also checks that floating point numbers come through correctly by seeing message has correct value.
   </td>
  </tr>
<tr>
   <td>74
   </td>
   <td>pipe31
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>3
   </td>
    <td>
   </td>
   <td>The meter in DB is set to reading_duplication=3 and no value in curl. Repeat every reading 3x but should only see once.  Get standard cum values.
   </td>
  </tr>
  <tr>
   <td>75
   </td>
   <td>pipe32
   </td>
   <td>X
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>The meter in DB is set to time_sort='decreasing' and no value in curl. Should get usual values.
   </td>
  </tr>
 <tr>
   <td>76
   </td>
   <td>pipe34
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>X
   </td>
   <td>The meter in DB is set to end_only_time='true' and no value in curl. Should get usual values with first one dropped.
   </td>
  </tr>
</table>

## Tests with multiple input files of first two meter and then readings

The two input neter files will be pipe#AInputMeter.csv & pipe#BInputMeter.csv, the input readings file will be pipe#CInput.csv and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected. The meter values should also be tested.

<table>
  <tr>
   <td>number
   </td>
   <td>manual test ID
   </td>
   <td>Descending time
   </td>
   <td>Cumulative
   </td>
   <td>Cumulative reset
   </td>
   <td>Reading length variation
   </td>
   <td>Reading gap
   </td>
   <td>Duplication
   </td>
   <td>End only
   </td>
   <td>Description
   </td>
  </tr>
   <tr>
   <td>80
   </td>
   <td>pipe25
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>The meter in DB is set to cumulative via second curl. Also tests update without header. Expect usual cumulative values.
   </td>
  </tr>
</table>

## Tests with two input files of meters that are gzipped meters and then readings

The input meter file will be pipe#AInputMeter.csv.gz & pipe#BInputMeter.csv.gz, the input readings file will be pipe#CInput.csv and the expected output is in pipe#Expected.csv where that output CSV is empty if the readings are rejected. The meter values should also be tested.

<table>
  <tr>
   <td>number
   </td>
   <td>manual test ID
   </td>
   <td>Descending time
   </td>
   <td>Cumulative
   </td>
   <td>Cumulative reset
   </td>
   <td>Reading length variation
   </td>
   <td>Reading gap
   </td>
   <td>Duplication
   </td>
   <td>End only
   </td>
   <td>Description
   </td>
  </tr>
  <tr>
   <td>90
   </td>
   <td>pipe26
   </td>
   <td>
   </td>
   <td>X
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>The meter in DB is set to cumulative & cumulative_reset but not sent via curl. Checks creating and updating meter with gzip file and header. Expect usual cumulative values.
   </td>
  </tr>
 </table>

## Tests with one input file of meters

The input file will be pipe#InputMeter.csv. The meter values must be tested.

<table>
  <tr>
   <td>number
   </td>
   <td>manual test ID
   </td>
   <td>Descending time
   </td>
   <td>Cumulative
   </td>
   <td>Cumulative reset
   </td>
   <td>Reading length variation
   </td>
   <td>Reading gap
   </td>
   <td>Duplication
   </td>
   <td>End only
   </td>
   <td>Description
   </td>
  </tr>
   <tr>
    <td>100
   </td>
  <td>pipe40
   </td>
  <td>
   <td>
   </td>
   </td>
  <td>
   </td>
    <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>Give update name as parameter when more than one row in CSV on second one. All updates should be rejected with error. Original meter creation should give meters pipe40 and pipe40b. pipe40 sets note to note40, area to 13, reading to 17, start time to 1111-11-10 11:11:11 and end time to 1111-11-11 11:11:11 to test setting these values since not done before.
   </td>
  </tr>
  <tr>
   <td>101
   </td>
  <td>pipe41
   </td>
   <td>
   <td>
   </td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>File has two meters to insert where second is same name so should be rejected. Only see meter pipe41 with same values as last one.
   </td>
  </tr>
  <tr>
   <td>102
   </td>
  <td>pipe42
   </td>
   <td>
   <td>
   </td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
    <td>
   </td>
   <td>Update of meter but name does not exist
   </td>
  </tr>
</table>
