# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

# Dockerfile for OED Postgres server.
# Use a pinned version
FROM postgres:15.3

# Sent from the build for the database in the main docker-compose.yml file.
ARG OED_DB_PASSWORD

# All SQL files in the build context
# get copied into the container and
# run on init.
COPY *.sql /docker-entrypoint-initdb.d/
# Edit the initialization SQL file to used the passed OED database password.
# The one copied always has a password of opened.
# The edited password should correspond to the same named environment variable in
# the OED web container so they will match when the software tries to log in
# it will be successful.
RUN sed -i "s/opened/${OED_DB_PASSWORD}/" /docker-entrypoint-initdb.d/init.sql
