#!/bin/bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

echo "This script assumes you have OED running."
echo "This script should not be run with a different container meaning don't user docker compose."
echo "Time estimates will vary depending on your machine and what it is doing."
echo "The terminal where you started OED will show any errors and some of the activity going on"
echo "  but normally only once the loading of data into OED begins."
echo "Comments inside this script tell you how to delete all current readings and meters from the"
echo "  database if you already ran this before and need to remove that data. You will likley get "
echo "  a warning about"
echo "  \"The current reading startTime is not after the previous reading's end time\"..."
echo "  if you rerun without doing this but the result is normally fine."

# The following lines can be used to remove all the readings and meter associated with
# the test data. This is valuable if you want to run the process again and the
# meters and readings already exist.
# NOTE this removes the meters and readings. You may need to remove dependent groups
# before doing this in the web groups page in OED.
# Get into postgres in the terminal.
# docker-compose exec database psql -U oed
# Remove all the readings. Normally gives "DELETE 575218"
# > delete from readings where meter_id in (select id from meters where name in ('test4DaySin', 'test4HourSin', 'test23MinSin', 'test15MinSin', 'test23MinCos', 'testSqSin', 'testSqCos', 'testAmp1Sin', 'testAmp2Sin', 'testAmp3Sin', 'testAmp4Sin', 'testAmp5Sin', 'testAmp6Sin', 'testAmp7Sin'));
# Remove all the meters. Normally gives "DELETE 14"
# > delete from meters where name in ('test4DaySin', 'test4HourSin', 'test23MinSin', 'test15MinSin', 'test23MinCos', 'testSqSin', 'testSqCos', 'testAmp1Sin', 'testAmp2Sin', 'testAmp3Sin', 'testAmp4Sin', 'testAmp5Sin', 'testAmp6Sin', 'testAmp7Sin');
# Quit postgres.
# > \q

# OED main directory (normally this is run from that directory)
oeddir=.
# This is the directory where the test data will be placed.
testdatadir=$oeddir/src/server/test/db/data/automatedTests/
# This is the OED user that can upload CSV files and used. It is the default admin.
csvuser=test@example.com
# The password for the user
csvpassword='password'
# The names of the csv files to process
csvfiles=(
    fourDayFreqTestData.csv fourHourFreqTestData.csv twentyThreeMinuteFreqTestData.csv fifteenMinuteFreqTestData.csv 
    23FreqCosineTestData.csv 2.5AmpSineSquaredTestData.csv 2.5AmpCosineSquaredTestData.csv 15Freq1AmpSineTestData.csv 15Freq2AmpSineTestData.csv 
    15Freq3AmpSineTestData.csv 15Freq4AmpSineTestData.csv 15Freq5AmpSineTestData.csv 15Freq6AmpSineTestData.csv 15Freq7AmpSineTestData.csv
 )
# The names of the meters that will be used for each file (in same order)
 meternames=(
    test4DaySin test4HourSin test23MinSin test15MinSin test23MinCos testSqSin testSqCos testAmp1Sin testAmp2Sin testAmp3Sin testAmp4Sin testAmp5Sin testAmp6Sin testAmp7Sin 
 )

# Go to OED directory
cd $oeddir

# Generate the standard sample data.
echo
echo "Start generating first set of test data (square, varying freq of readings)."
echo "  This normally takes less than a minute:"
# This assumes you have a newer version (as of 2021) docker that has compose built in.
# In the past it was docker-compose.
docker compose run --rm web npm run generateTestingData
echo
echo "Start generating second set of test data (varying amplitudes)"
echo "  This normally takes about a minute:"
docker compose run --rm web npm run generateVariableAmplitudeTestingData

# Go to directory with test data
cd $testdatadir
# Load each set of test data readings into OED where create meter
echo
echo "Start loading each set of test data into OED."
echo "  This could take a number of minutes (maybe around 10 minutes):"
for ((i=0; i < ${#csvfiles[@]}; i++))
do
    echo "    loading meter ${meternames[i]} from file ${csvfiles[i]}"
    if [ $i == $((${#csvfiles[@]} - 1)) ]
    then
        # The last loaded data does a refresh of the readings so can see in OED and will do it for all previous data.
        curl localhost:3000/api/csv/readings -X POST -F "meterName=${meternames[i]}" -F 'refreshReadings=true' -F 'createMeter=true' -F 'headerRow=true' -F 'gzip=false' -F "email=$csvuser" -F "password=$csvpassword" -F "csvfile=@${csvfiles[i]}"
    else
        curl localhost:3000/api/csv/readings -X POST -F "meterName=${meternames[i]}" -F 'createMeter=true' -F 'headerRow=true' -F 'gzip=false' -F "email=$csvuser" -F "password=$csvpassword" -F "csvfile=@${csvfiles[i]}"
    fi
done

echo
echo "Starting to remove the CSV files with the test data. No output unless an issue."
for ((i=0; i < ${#csvfiles[@]}; i++))
do
        rm ${csvfiles[i]}
done

echo
echo "The process is now done."
echo
echo "***Meters created through this script are only visible by an admin."
echo "   You can change this on the web meters page in OED (make sure to save changes).***"
