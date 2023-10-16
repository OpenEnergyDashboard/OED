#!/bin/bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

# Change the password encryption from md5 to scram-sha-256
echo "Changing password encryption to scram-sha-256 ..."
sed -i "s/^#password_encryption = md5/password_encryption = scram-sha-256/" postgres-data/postgresql.conf

# Update the encryption method and check it was changed
docker compose exec database psql -U oed -c "SELECT pg_reload_conf();"
echo "Checking password encryption was changed ..."
docker compose exec database psql -U oed -c "SHOW password_encryption;"

# Prompt the user to reset the passwords for users oed and postgres
echo "Please reset password for database user oed"
echo "Should be: $(docker compose exec web printenv OED_DB_PASSWORD)"
docker compose exec database psql -U oed -c "\password oed"
echo ""

echo "Please reset password for database user postgres"
echo "Should be: $(docker compose exec database printenv POSTGRES_PASSWORD)"
docker compose exec database psql -U oed -c "\password postgres"
echo ""

# Create a dump of the database
echo "Creating dump of database ..."
docker compose exec database pg_dumpall --clean -U oed > script_database_dump.sql

# Comment out the lines in the database dump that drop and recreate the users
sed -i "s/^DROP ROLE oed/-- DROP ROLE oed/" script_database_dump.sql
sed -i "s/^DROP ROLE postgres/-- DROP ROLE postgres/" script_database_dump.sql
sed -i "s/^CREATE ROLE oed/-- CREATE ROLE oed/" script_database_dump.sql
sed -i "s/^ALTER ROLE oed/-- ALTER ROLE oed/" script_database_dump.sql
sed -i "s/^CREATE ROLE postgres/-- CREATE ROLE postgres/" script_database_dump.sql
sed -i "s/^ALTER ROLE postgres/-- ALTER ROLE postgres/" script_database_dump.sql
echo ""

# Change the postgres version up to the latest
echo "Changing postgres version in Dockerfile ..."
sed -i "s/^FROM postgres:10.13/FROM postgres:15.3/" containers/database/Dockerfile
echo ""

echo "Script completed"
echo ""
echo "Shut down OED before running the next script"