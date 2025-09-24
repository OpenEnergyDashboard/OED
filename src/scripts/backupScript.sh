#!/bin/bash
# 
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# The OED Docker database container must be running for this script to work

# Input the pathname for the desired backup directory
# ie PATH="/home/<your_username>/path_to/database_dumps/"
# This path MUST exist, otherwise, this script will attempt to create the directory, or fail.

# This could probably be programmatically populated. Currently needs to be set manually
db_dump_path="/home/<username>/database_dumps" #INPUT REQUIRED

# Checks to see if the directory is exists
# If not, it will display a message, and attempt to create the backup directory
if [ ! -d "$db_dump_path" ]; then
    echo "Backup directory does not exist. Creating it now..."
    mkdir -p "$db_dump_path" || { echo "Failed to create directory. Exiting."; exit 1; }
fi

# Generate a timestamp to append to the dump file.
date=`date +%Y-%m-%d_%H_%M_%S`

# Set the final path for the backup file
final_path="${db_dump_path}/dump_${date}.sql"

# Perform the backup using pg_dump
docker compose exec database pg_dump -U oed > "$final_path"

echo "OED database backup placed in ${final_path}"
