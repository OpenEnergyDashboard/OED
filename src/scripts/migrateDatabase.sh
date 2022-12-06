#!/bin/bash

#Change the password encryption from md5 to scram-sha-256
sed -i "s/^#password_encryption = md5/password_encryption = scram-sha-256/" postgres-data/postgresql.conf

#Update the encryption method and check it was changed
docker compose exec database psql -U oed -c "SELECT pg_reload_conf();"
docker compose exec database psql -U oed -c "SHOW password_encryption;"

#Prompt the user to reset the passwords for users oed and postgres
docker compose exec database psql -U oed -c "\password oed"
docker compose exec database psql -U oed -c "\password postgres"

#Create a dump of the database
docker compose exec database pg_dumpall --clean -U oed > script_database_dump.sql

#Comment out the lines in the database dump that drop and recreate the users
sed -i "s/^DROP ROLE oed/-- DROP ROLE oed" script_database_dump.sql
sed -i "s/^DROP ROLE postgres/-- DROP ROLE postgres" script_database_dump.sql
sed -i "s/^CREATE ROLE oed/-- CREATE ROLE oed" script_database_dump.sql
sed -i "s/^ALTER ROLE oed/-- ALTER ROLE oed" script_database_dump.sql
sed -i "s/^CREATE ROLE postgres/-- CREATE ROLE postgres" script_database_dump.sql
sed -i "s/^ALTER ROLE postgres/-- ALTER ROLE postgres" script_database_dump.sql

#Change the postgres version up to the latest
sed -i "s/^FROM postgres:10.13/-- FROM postgres:14.5" containers/database/Dockerfile