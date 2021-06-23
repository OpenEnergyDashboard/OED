# CSV web testing tools

Here are some sample files for testing the csv pipeline route.

For instance:

```bash
curl localhost:3000/api/csv/readings -X POST \
	-F 'meterName=solar' \
	-F 'gzip=false' \
	-F 'createMeter=true' \
	-F 'cumulative=false' \
	-F 'cumulativeReset=false' \
	-F 'duplications=1' \
	-F 'headerRow=false' \
	-F 'timeSort=increasing' \
	-F 'email=test@example.com' \
	-F 'password=password' \
	-F 'csvfile=@src/server/test/web/csvPipeline/sampleReadings.csv'
```

## Testing the new pipeline and CSV uploads

The following is a description of how the new pipeline was tested during evaluation of the PR. It is planned to convert these tests to automated tests in the future.

The CSV test files are described in the following table. The script pipelineCurl.sh runs the commands for each case and assumes OED is up and running. It creates a new meter for each file. Reading normally go from 6/1/21-6/5/21 (5 points) where get straight line from 1 to 5 so values are 1, 2, 3, 4 & 5 when plotted. In the readings table the values will be 24, 48, 72, 96 & 120 because over 24 hours. With cumulative you lose the first value. With the noon reset/start time you get Get 2.0, 2.5, 3.5, 4.5, 5 as readings since the days other than the first/last average between two readings.

Note get two warning messages if load more than once on many cases because the time of the first reading is before the last time loaded before.

Looked at readings with: select * from readings where meter_id in (select id from meters where name='pipe#');

The script also describes how to delete all the meters/readings if you want to rerun from scratch.

<table>
  <tr>
   <td>File name (.csv)
   </td>
   <td>Nominal meter name
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
   <td>Description
   </td>
  </tr>
  <tr>
   <td>regAsc
   </td>
   <td>pipe1
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
   <td>Normal 1-5 values
   </td>
  </tr>
  <tr>
   <td>regDsc
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
   <td>Decreasing time for readings but expect usual values.
   </td>
  </tr>
  <tr>
   <td>cumAsc
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
   <td>Drops 1<sup>st</sup> reading as expected
   </td>
  </tr>
  <tr>
   <td>cumDsc
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
   <td>Decreasing in time. Drops 1<sup>st</sup> reading as expected.
   </td>
  </tr>
  <tr>
   <td>cumAscResetMidnight
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
   <td>Drops 1<sup>st</sup> reading as expected
   </td>
  </tr>
  <tr>
   <td>cumAscResetMidnight
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
   <td>Same as above but explicit reset times and backward for start/end
   </td>
  </tr>
  <tr>
   <td>cumAscResetMidnight
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
   <td>Similar to above but reset times wrong so drops all readings; forward for start/end reset
   </td>
  </tr>
  <tr>
   <td>cumAscResetMidnight
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
   <td>Same as second midnight above above but reset times tight so see all but first value
   </td>
  </tr>
  <tr>
   <td>cumAscResetMidnight
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
   <td>Make sure rejects all readings if reset not indicated
   </td>
  </tr>
  <tr>
   <td>cumAscResetNoon
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
   <td>Allows reset at any time so all but first value.
   </td>
  </tr>
  <tr>
   <td>cumAscResetNoon
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
   <td>Make sure rejects all readings if reset not indicated
   </td>
  </tr>
  <tr>
   <td>cumAscResetNoon
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
   <td>explicit reset times and forward for start/end so same as 2 above where all but first.
   </td>
  </tr>
  <tr>
   <td>cumAscResetNoon
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
   <td>reset times wrong and backward for start/end so should have no values
   </td>
  </tr>
  <tr>
   <td>regAscLen
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
   <td>Time varies by 1 & 2 min; All but 1<sup>st</sup> point vary slightly in reading due to time variation  – get low, high, high, low as expected; should get 4 warnings for line 2-5
   </td>
  </tr>
  <tr>
   <td>regAscLen
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
   <td>Time varies by 1 & 2 min and allow 1 min (60 sec); Should warn about lines 3, 5.
   </td>
  </tr>
  <tr>
   <td>regAscLen
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
   <td>Time varies by 1 & 2 min; Should warn about line 5.
   </td>
  </tr>
  <tr>
   <td>regAscGap
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
   <td>Should get warning for lines 2 & 4. Length variation so no warnings about that. Point 2 & 4 should be slightly high since shorter length.
   </td>
  </tr>
  <tr>
   <td>regAscGap
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
   <td>Similar to above but now only warning for line 4.
   </td>
  </tr>
  <tr>
   <td>regAscGap
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
   <td>Similar to above but no warnings.
   </td>
  </tr>
  <tr>
   <td>cumAscHeader
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
   <td>Check header. Get standard cum values.
   </td>
  </tr>
  <tr>
   <td>CumAscHeader.csv.gz
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
   <td>Check gzip (with header). Get standard cum values.
   </td>
  </tr>
  <tr>
   <td>cumAscDuplication3
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
   <td>Repeat every reading 3x but should only see once.  Get standard cum values.
   </td>
  </tr>
  <tr>
   <td>cumAscNegative
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
   <td>Negative reading on #4 with cumulative so should get no reading.
   </td>
  </tr>
  <tr>
   <td>cumAsc & cumAscAdd1 & cumAscAdd2
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
   <td>Add in cumulative readings via two more uploads of a single value. Expect normal cum readings plus 6 & 7.
   </td>
  </tr>
  <tr>
   <td>cumAsc & cumAscAddReset
   </td>
   <td>pipe24
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
   <td>Add two more values via second curl but this time the first one involves a reset. Expect normal cum readings plus 6 & 7.
   </td>
  </tr>
  <tr>
   <td>CumAsc & meterPipe25 (to create meter)
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
   <td>The meter in DB is set to cumulative but not sent via curl. Expect usual cumulative values.
   </td>
  </tr>
  <tr>
   <td>cumAscResetMidnight & meterPipe26 (to create meter)
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
   <td>The meter in DB is set to cumulative & cumulative_reset but not sent via curl. Expect usual cumulative values.
   </td>
  </tr>
  <tr>
   <td>cumAscResetMidnight & meterPipe27 (to create meter)
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
   <td>The meter in DB is set to cumulative, cumulative_reset to true & reset range is 11:45-12:15 but not sent via curl. The reset value should be reject row 4 since negative and no readings for meter.
   </td>
  </tr><tr>
   <td>cumAscResetMidnight & meterPipe28 (to create meter)
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
   <td>The meter in DB is set to cumulative, cumulative_reset to true & reset range is 11:45-12:15 but then sent via curl so should reset around midnight. Should get usual cumulative values.
   </td>
  </tr>
  <tr>
   <td>RegAscGapLength & meterPipe29 (to create meter)
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
   <td>The meter in DB is set to reading_gap=60 and reading_variation=120. Should get warning for gap for line 4 and Length variation for line 5. Expect 1, 2+, 3, 4+, 5-, 5- (same as previous point and extra one since last reading goes into next day)
   </td>
  </tr>
 <tr>
   <td>RegAscGapLength & meterPipe30 (to create meter)
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
   <td>The meter in DB is set to reading_gap=60 and reading_variation=120 but then the curl passes 120 and 121 for gap & variation. Should get Length variation for line 5. Expect 1, 2+, 3, 4+, 5-, 5- (same as previous point and extra one since last reading goes into next day)
   </td>
  </tr>
<tr>
   <td>cumAscDuplication3 & meterPipe31 (to create meter)
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
   <td>The meter in DB is set to reading_duplication=3 and no value in curl. Repeat every reading 3x but should only see once.  Get standard cum values.
   </td>
  </tr>
  <tr>
   <td>regDsc & meterPipe32 (to create meter)
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
   <td>The meter in DB is set to time_sort='decreasing' and no value in curl. Should get usual values.
   </td>
  </tr>

</table>
