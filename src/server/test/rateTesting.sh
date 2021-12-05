#!/bin/bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

# This script is used to test if OED requests are properly limited.
# It is designed for developers and runs on localhost by default.
# See src/server/app.js for the overall rate limiting logic.

# Here are examples of how to use this script:
# See if 3 requests where separated by 0.5 seconds to get the logo are allowed:
# ./rateTesting.sh 3 0.5 localhost:3000/logo.png
# See if 5 requests where separated by 0.1 seconds to get meter 1 line data over all time are allowed:
# ./rateTesting.sh 5 0.1 'localhost:3000/api/readings/line/meters/1?timeInterval=all'
# Same as above but see the output.
# ./rateTesting.sh 5 0.1 'localhost:3000/api/readings/line/meters/1?timeInterval=all' true
# Test the separately limited raw download:
# ./rateTesting.sh 8 0.1 'localhost:3000/api/readings/line/raw/meters/1'

doRequest() {
    # The first parameter is the test number to use for output.
    testNumber=$1
    # The second parameter is the URL to request.
    urlToRequest=$2
    # The third parameter is true if you want to show the ouput of each request (errors always show).
    if [ "$3" = true ]; then
        showOutput=true
    else
        showOutput=false
    fi
    # The fourth parameter is the file to use for curl output.
    fileName=$4

    # You may need to comment out the echo if you want to do a lot of requests very quickly.
    # This gives time to nearest second and works on both Linux and Mac.
    echo "starting request $testNumber at time $(date)"
    # date to milliseconds that works on most Linux systems
    # TODO needs to be tested
    # echo "starting request $testNumber at time $(date +"%T.%3N")"
   
   if [ "$showOutput" = true ]; then
        curl -s -S $urlToRequest | tee -a $fileName
    else
        curl -s -S $urlToRequest >> $fileName
    fi
  
    echo "finished request $testNumber at time $(date)"

    # See if request was rate limited.
    numLimited=$(grep -o  "Too many requests, please try again later." $fileName | wc -l)
    if [ "$numLimited" -gt 0 ]; then
        echo "***Request $testNumber was rate limited."
    # else
    #     echo "Request $testNumber was not rate limited."
    fi
}

# Parameters to main script
# The first parameter is the number of requests to make with default of one.
if [ -z "$1" ]; then
    numRequests=1
else
    numRequests=$1
fi

# The second parameter is the time to wait between requests in seconds or zero by default.
if [ -z "$2" ]; then
    waitBetweenRequests=0
else
    waitBetweenRequests=$2
fi
# The third parameter is the request which is to get the logo on localhost by default.
# Some example ones are:
# Get line reading values over all time for meter 1.
# "localhost:3000/api/readings/line/meters/1?timeInterval=all -X GET"
# TODO example for getting raw readings.
# Default to get the logo.
# "localhost:3000/logo.png"
if [ -z "$3" ]; then
    requestToMake=localhost:3000/logo.png
else
    requestToMake=$3
fi
# The fourth parameter is true if you want to show the output of the requests.
# To see some errors you need to set this to true.
if [ -z "$4" ]; then
    showOutput=false
else
    showOutput=$4
fi

# file name for curl output with of requests
fileName="/tmp/curlOutput$RANDOM"

echo "Starting $numRequests requests to $requestToMake with a wait of $waitBetweenRequests seconds between each request with show output of $showOutput:"
for ((i=1; i<=$numRequests; i++)) {
    # Run request in background so others can run at the same time.
    # Use quotes so spaces do not cause problems.
    doRequest "$i" "$requestToMake" "$showOutput" "$fileName#$i" &

    sleep $waitBetweenRequests
}
# Don't continue until all requests are done.
wait
echo "All requests finished."

# See how many requests were rate limited.
numLimited=$(grep -o  "Too many requests, please try again later." "$fileName#"* | wc -l)
echo "$numLimited request(s) were rate limited."

# Get rid of temporary files.
rm "$fileName#"*
