# Dockerfile for OED Postgres server.
# Use a pinned version
FROM postgres:9.6

# All SQL files in the build context
# get copied into the container and
# run on init.
COPY *.sql /docker-entrypoint-initdb.d/
