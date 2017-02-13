#!/usr/bin/env bash

# The absolute path the project root directory (ED-JS) No trailing /
project='/home/james/documents/365-database_capstone/ED-JS'

# Log file -- Fill in the absolute path to the file you wish to log to.
log='/home/james/documents/365-database_capstone/tempLog'

# The following two lines should NOT need to be edited except by devs.
toRun=${project}'/src/server/services/meterCron.js'
node --harmony-async-await &>> ${log} ${toRun} &
