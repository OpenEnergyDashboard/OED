#!/usr/bin/env bash
# This should be copied to /etc/cron.hourly/ and the copy renamed so that its function will be clear to admins.
# The absolute path the project root directory (ED-JS) No trailing /
project='/example/path/to/project/ED-JS'

# Log file -- Fill in the absolute path to the file you wish to log to.
log='/example/path/to/log_file'

# The following two lines should NOT need to be edited except by devs.
toRun=${project}'/src/server/services/updateMeters.js'
node --harmony-async-await &>> ${log} ${toRun} &
