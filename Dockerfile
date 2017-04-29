# Dockerfile for NodeJS application portion
# It must be in the root directory so that the build context includes the
# package.json and source code.
FROM node:latest

# Create the directory for the app
RUN mkdir -p "/usr/src/app"
WORKDIR "/usr/src/app"

# Copy the package.json; this will get overwritten by the VOLUME
# mounting below, but it's needed for NPM.
COPY "package.json" "package.json"

# Set up the environment with NPM. This step
# can take a long time.
RUN /usr/local/bin/npm install --silent

# Mount the source code at this volume
# Mount instead of copy allows the auto-reload to work
VOLUME "/usr/src/app"
