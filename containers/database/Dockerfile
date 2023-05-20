# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

# Dockerfile for OED Postgres server.
# Use a pinned version
FROM postgres:15.3

# All SQL files in the build context
# get copied into the container and
# run on init.
COPY *.sql /docker-entrypoint-initdb.d/
