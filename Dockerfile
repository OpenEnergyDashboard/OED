# Dockerfile for NodeJS application portion
# It must be in the root directory so that the build context includes the
# package.json and source code.
FROM node:latest

# Create the directory for the app
RUN mkdir -p "/usr/src/app"
WORKDIR "/usr/src/app"

# Mount the source code at this volume
# Mount instead of copy allows the auto-reload to work
VOLUME "/usr/src/app"
