#!/bin/bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

# Remove the postgres-data folder to start from a clean install
echo "Removing postgres-data folder ..."
rm -r postgres-data
echo ""

# Remove docker containers
echo "Removing docker containers ..."
docker compose down
echo ""

# Reload docker containers
echo "Reloading docker containers ..."
docker compose up --no-start --build
echo ""

# Bring the database container back up
echo "Starting database container ..."
docker compose restart database
echo ""

# Restore the dump to the database
# Add some delay before restoring dump
sleep 5
echo "Restoring database dump ..."
# The -T was needed so docker does not complain about tty on one Window 11 machine.
# Hopefully this works on all OSes as it is part of docker.
docker compose exec -T database psql -U postgres < script_database_dump.sql
echo ""

# Shut down the database container
echo "Shutting down database container ..."
docker compose stop database
echo ""

echo "Script completed"
