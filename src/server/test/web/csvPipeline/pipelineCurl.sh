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
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=false' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe25.csv'
# edit meter so cumulative is true
docker compose -f $oedHome/docker-compose.yml exec database psql -U oed -c "update meters set cumulative=true where name='pipe25'"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe25' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAsc.csv'
echo -e "\n\n<h3>starting pipe26</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=false' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe26.csv'
# edit meter so cumulative & reset is true
docker compose -f $oedHome/docker-compose.yml exec database psql -U oed -c "update meters set cumulative=true where name='pipe26'; update meters set cumulative_reset=true where name='pipe26'"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe26' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscResetMidnight.csv'
echo -e "\n\n<h3>starting pipe27</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=false' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe27.csv'
# edit meter so cumulative, reset  & reset times around noon is true
docker compose -f $oedHome/docker-compose.yml exec database psql -U oed -c "update meters set cumulative=true where name='pipe27'; update meters set cumulative_reset=true where name='pipe27'; update meters set cumulative_reset_start='11:45' where name='pipe27'; update meters set cumulative_reset_end='12:15' where name='pipe27'"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe27' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscResetMidnight.csv'
echo -e "\n\n<h3>starting pipe28</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=false' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe28.csv'
# edit meter so cumulative, reset  & reset times around noon is true
docker compose -f $oedHome/docker-compose.yml exec database psql -U oed -c "update meters set cumulative=true where name='pipe28'; update meters set cumulative_reset=true where name='pipe28'; update meters set cumulative_reset_start='11:45' where name='pipe28'; update meters set cumulative_reset_end='12:15' where name='pipe28'"
# override DB by providing parameters
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'cumulativeReset=true' -F'cumulativeResetStart=23:45' -F'cumulativeResetEnd=00:15' -F 'meterName=pipe28' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscResetMidnight.csv'
echo -e "\n\n<h3>starting pipe29</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=false' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe29.csv'
# edit meter so gap & variation are set
docker compose -f $oedHome/docker-compose.yml exec database psql -U oed -c "update meters set reading_gap=60 where name='pipe29'; update meters set reading_variation=120 where name='pipe29'"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe29' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscGapLength.csv'
echo -e "\n\n<h3>starting pipe30</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=false' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe30.csv'
# edit meter so gap & variation are set
docker compose -f $oedHome/docker-compose.yml exec database psql -U oed -c "update meters set reading_gap=60 where name='pipe30'; update meters set reading_variation=60 where name='pipe30'"
# override DB by providing parameters
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe30' -F 'lengthGap=120.1' -F 'lengthVariation=120.2' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscGapLength.csv'
echo -e "\n\n<h3>starting pipe31</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=false' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe31.csv'
# edit meter so set duplication
docker compose -f $oedHome/docker-compose.yml exec database psql -U oed -c "update meters set reading_duplication=3 where name='pipe31'"
curl localhost:3000/api/csv/readings -X POST -F 'cumulative=true' -F 'meterName=pipe31' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@cumAscDuplication3.csv'
echo -e "\n\n<h3>starting pipe32</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=false' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe32.csv'
# edit meter so set timesort to decreasing
docker compose -f $oedHome/docker-compose.yml exec database psql -U oed -c "update meters set time_sort='decreasing' where name='pipe32'"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe32' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regDsc.csv'
echo -e "\n\n<h3>starting pipe34</h3>"
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=false' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@meterPipe34.csv'
# edit meter so set end only to true
docker compose -f $oedHome/docker-compose.yml exec database psql -U oed -c "update meters set end_only_time='true' where name='pipe34'"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe34' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscEndonly.csv'
echo -e "\n\n<h3>starting pipe35</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe35' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAsc.csv'
# Insert new 0 at start, 6 at end and update original first to be 1.5 and last to be 5.5.
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe35' -F 'update=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscUpdate.csv'
echo -e "\n\n<h3>starting pipe36</h3>"
curl localhost:3000/api/csv/readings -X POST -F 'meterName=pipe36' -F 'createMeter=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAsc.csv'
# Insert new 0 at start, 6 at end and update original first to be 1.5 and last to be 5.5.
# refresh on last upload of readings and all will be available for graphing
curl localhost:3000/api/csv/readings -X POST -F 'refreshReadings=true' -F 'meterName=pipe36' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscUpdate.csv'

# final blank line so easier to see in terminal.
echo -e ""