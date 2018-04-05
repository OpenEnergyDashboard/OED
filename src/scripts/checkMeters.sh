#!/bin/bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

USAGE="Usage: checkMeters.sh Takes a CSV file of meter IP addresses on standard in. Use as cat ips.csv | checkMeters.sh or checkMeters.sh < ips.csv"

# Throw out header
read line

while read line
do
	echo "$line:"
	curl -s -m 1 "http://$line" > /dev/null
	success=$?
	if [ "$success" == "0" ]; then
		echo "	GOOD"
	else
		echo "	NO GOOD $success"
	fi
done
