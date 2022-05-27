#!/bin/bash

# The following lines can be used to remove all the readings and meter associated with
# the pipeline test data. This is valuable if you want to run the process again and the
# meters and readings already exist.
# NOTE this removes the meters and readings. You may need to remove dependent groups
# before doing this in the web groups page in OED.
# This assumes you do not have any meters named pipe* of they will also be removed.
# Get into postgres in the terminal.
# docker-compose exec database psql -U oed
# Remove all the readings.
# > delete from readings where meter_id in (select id from meters where name like 'pipe%');
# Remove all the meters. Normally gives "DELETE 28"
# > delete from meters where name like 'pipe%';
# Quit postgres.
# > \q

# You need to set this to your actual OED home directory.
oedHome=~/OED/OED

echo -e "\n\n<h3>starting pipe1</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe1' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAsc.csv'
echo -e "\n\n<h3>starting pipe2</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe2' -F 'timeSort=decreasing' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regDsc.csv'
echo -e "\n\n<h3>starting pipe3</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'meterName=pipe3' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAsc.csv'
echo -e "\n\n<h3>starting pipe33</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'timeSort=decreasing' -F 'cumulative=true' -F 'meterName=pipe33' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumDsc.csv'
echo -e "\n\n<h3>starting pipe4</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'cumulativeReset=true' -F 'meterName=pipe4' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscResetMidnight.csv'
echo -e "\n\n<h3>starting pipe5</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'cumulativeReset=true' -F'cumulativeResetStart=23:45' -F'cumulativeResetEnd=00:15' -F 'meterName=pipe5' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscResetMidnight.csv'
echo -e "\n\n<h3>starting pipe6</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'cumulativeReset=true' -F'cumulativeResetStart=11:45' -F'cumulativeResetEnd=12:15' -F 'meterName=pipe6' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscResetMidnight.csv'
echo -e "\n\n<h3>starting pipe7</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'cumulativeReset=true' -F'cumulativeResetStart=00:00' -F'cumulativeResetEnd=00:00.001' -F 'meterName=pipe7' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscResetMidnight.csv'
echo -e "\n\n<h3>starting pipe8</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'meterName=pipe8' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscResetMidnight.csv'
echo -e "\n\n<h3>starting pipe9</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'cumulativeReset=true' -F 'meterName=pipe9' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscResetNoon.csv'
echo -e "\n\n<h3>starting pipe10</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'meterName=pipe10' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscResetNoon.csv'
echo -e "\n\n<h3>starting pipe11</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'cumulativeReset=true' -F'cumulativeResetStart=11:45' -F'cumulativeResetEnd=12:15' -F 'meterName=pipe11' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscResetNoon.csv'
echo -e "\n\n<h3>starting pipe12</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'cumulativeReset=true' -F'cumulativeResetStart=23:45' -F'cumulativeResetEnd=00:15' -F 'meterName=pipe12' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscResetNoon.csv'
echo -e "\n\n<h3>starting pipe13</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe13' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscLen.csv'
echo -e "\n\n<h3>starting pipe14</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe14' -F 'lengthVariation=60' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscLen.csv'
echo -e "\n\n<h3>starting pipe15</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe15' -F 'lengthVariation=120' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscLen.csv'
echo -e "\n\n<h3>starting pipe16</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe16' -F 'lengthVariation=121' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscGap.csv'
echo -e "\n\n<h3>starting pipe17</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe17' -F 'lengthGap=60' -F 'lengthVariation=121' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscGap.csv'
echo -e "\n\n<h3>starting pipe18</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe18' -F 'lengthGap=120' -F 'lengthVariation=121' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscGap.csv'
echo -e "\n\n<h3>starting pipe19</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'headerRow=true' -F 'cumulative=true' -F 'meterName=pipe19' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscHeader.csv'
echo -e "\n\n<h3>starting pipe20</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'headerRow=true' -F 'cumulative=true' -F 'meterName=pipe20' -F 'createMeter=true' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscHeader.csv.gz'
echo -e "\n\n<h3>starting pipe21</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'duplications=3' -F 'cumulative=true' -F 'meterName=pipe21' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscDuplication3.csv'
echo -e "\n\n<h3>starting pipe22</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'cumulativeReset=true' -F 'meterName=pipe22' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscNegative.csv'
echo -e "\n\n<h3>starting pipe35</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'endOnly=true' -F 'meterName=pipe35' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscEndonly.csv'
echo -e "\n\n<h3>starting pipe36</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'timeSort=decreasing' -F 'endOnly=true' -F 'meterName=pipe36' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regDscEndonly.csv'
echo -e "\n\n<h3>starting pipe37</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'timeSort=decreasing' -F 'endOnly=true' -F 'meterName=pipe37' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumDscEndonly.csv'
echo -e "\n\n<h3>starting pipe23</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'meterName=pipe23' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAsc.csv'
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'meterName=pipe23' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscAdd1.csv'
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'meterName=pipe23' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscAdd2.csv'
echo -e "\n\n<h3>starting pipe24</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'meterName=pipe24' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAsc.csv'
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'cumulativeReset=true' -F 'meterName=pipe24' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscAddReset.csv'
echo -e "\n\n<h3>starting pipe25</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe25.csv'
# update meter so cumulative is true
curl localhost:3000/api/csv/meters -X POST -F'meterName=pipe25' -F 'update=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe25Update.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe25' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAsc.csv'
echo -e "\n\n<h3>starting pipe26</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe26.csv.gz'
# update meter so cumulative & reset is true
curl localhost:3000/api/csv/meters -X POST -F 'meterName=pipe26x' -F 'update=true' -F 'headerRow=true' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe26Update.csv.gz'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe26' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscResetMidnight.csv'
echo -e "\n\n<h3>starting pipe27</h3>"
# create meter so cumulative, reset  & reset times around noon is true
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe27.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe27' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscResetMidnight.csv'
echo -e "\n\n<h3>starting pipe28</h3>"
# create meter so cumulative, reset  & reset times around noon is true
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe28.csv'
# override DB by providing parameters
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'cumulativeReset=true' -F'cumulativeResetStart=23:45' -F'cumulativeResetEnd=00:15' -F 'meterName=pipe28' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscResetMidnight.csv'
echo -e "\n\n<h3>starting pipe29</h3>"
# create meter so gap & variation are set
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe29.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe29' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscGapLength.csv'
echo -e "\n\n<h3>starting pipe30</h3>"
# create meter so gap & variation are set
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe30.csv'
# override DB by providing parameters
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe30' -F 'lengthGap=120.1' -F 'lengthVariation=120.2' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscGapLength.csv'
echo -e "\n\n<h3>starting pipe31</h3>"
# create meter so set duplication
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe31.csv'
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'meterName=pipe31' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscDuplication3.csv'
echo -e "\n\n<h3>starting pipe32</h3>"
# create meter so set timesort to decreasing
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe32.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe32' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regDsc.csv'
echo -e "\n\n<h3>starting pipe34</h3>"
# create meter so set end only to true
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe34.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe34' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscEndonly.csv'
echo -e "\n\n<h3>starting pipe38</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe38' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAsc.csv'
# Insert new 0 at start, 6 at end and update original first to be 1.5 and last to be 5.5.
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe38' -F 'update=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscUpdate.csv'
echo -e "\n\n<h3>starting pipe39</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe39' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAsc.csv'
# Insert new 0 at start, 6 at end and update original first to be 1.5 and last to be 5.5.
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe39' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscUpdate.csv'
echo -e "\n\n<h3>starting pipe40</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe40.csv'
curl localhost:3000/api/csv/meters -X POST -F 'meterName=pipe40' -F 'update=true' -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe40.csv'
echo -e "\n\n<h3>starting pipe41</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe41.csv'
echo -e "\n\n<h3>starting pipe42</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'update=true' -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe42.csv'
echo -e "\n\n<h3>starting pipe43</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe43' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscBadStarttime.csv'
echo -e "\n\n<h3>starting pipe44</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe44' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscBadEndtime.csv'
echo -e "\n\n<h3>starting pipe45</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe45' -F 'relaxedParsing=true' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscVariedFormats.csv'
echo -e "\n\n<h3>starting pipe46</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'meterName=pipe46' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscBadReading.csv'
echo -e "\n\n<h3>starting pipe47</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe47' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscBadReading.csv'
echo -e "\n\n<h3>starting pipe48</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe48' -F 'cumulative=true' -F 'lengthVariation=121' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscGap.csv'
echo -e "\n\n<h3>starting pipe49</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe49' -F 'cumulative=true' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscStartBeforePreviousEnd.csv'
echo -e "\n\n<h3>starting pipe50</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe50' -F 'cumulative=true' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscNeg.csv'
echo -e "\n\n<h3>starting pipe51</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe51' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscZeroTime.csv'
echo -e "\n\n<h3>starting pipe52</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe52' -F 'endOnly=true' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscEndonlyEndSamePreviousEnd.csv'
# The following need to create meter separately since needs to have timezone.
echo -e "\n\n<h3>starting pipe53</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe53.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe53' -F 'honorDst=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@daylightForwardHourlyCT.csv'
echo -e "\n\n<h3>starting pipe54</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe54.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe54' -F 'honorDst=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@daylightForwardDailyCT.csv'
echo -e "\n\n<h3>starting pipe55</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe55.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe55' -F 'honorDst=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@daylightForward15MinCT.csv'
echo -e "\n\n<h3>starting pipe56</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe56.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe56' -F 'honorDst=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@daylightForward23MinCT.csv'
echo -e "\n\n<h3>starting pipe57</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe57.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe57' -F 'honorDst=true' -F 'cumulative=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@daylightForward23MinCumulativeCT.csv'
echo -e "\n\n<h3>starting pipe58</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe58.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe58' -F 'honorDst=true' -F 'endOnly=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@daylightForward23MinEndCT.csv'
echo -e "\n\n<h3>starting pipe59</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe59.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe59' -F 'honorDst=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@daylightBackwardHourlyCT.csv'
echo -e "\n\n<h3>starting pipe60</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe60.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe60' -F 'honorDst=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@daylightBackwardDailyCT.csv'
echo -e "\n\n<h3>starting pipe61</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe61.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe61' -F 'honorDst=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@daylightBackward15MinCT.csv'
echo -e "\n\n<h3>starting pipe62</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe62.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe62' -F 'honorDst=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@daylightBackward23MinCT.csv'
echo -e "\n\n<h3>starting pipe63</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe63.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe63' -F 'honorDst=true' -F 'cumulative=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@daylightBackward23MinCumulativeCT.csv'
echo -e "\n\n<h3>starting pipe64</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe64.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe64' -F 'honorDst=true' -F 'endOnly=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@daylightBackward23MinEndCT.csv'
echo -e "\n\n<h3>starting pipe65</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe65.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe65' -F 'honorDst=true' -F 'endOnly=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@daylightBackward23MinEndACT.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe65' -F 'honorDst=true' -F 'endOnly=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@daylightBackward23MinEndBCT.csv'
echo -e "\n\n<h3>starting pipe66</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe66.csv'
# refresh on last upload of readings and all will be available for graphing
curl localhost:3000/api/csv/readings -X POST -F 'refreshReadings=true' -F 'meterName=pipe66' -F 'honorDst=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@daylightBackwardGapCT.csv'

# final blank line so easier to see in terminal.
echo -e ""