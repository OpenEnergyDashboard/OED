# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

# Dockerfile for NodeJS application portion
# Make sure the node version here matches .github/workflows/build.yml for the GitHub workflow.
FROM node:18.17.1

# Create the directory for the app
RUN mkdir -p "/usr/src/app"
WORKDIR "/usr/src/app"

# Create a dedicated non-root runtime user/group
RUN addgroup --gid 10001 appgroup \
 && adduser --disabled-password --gecos "" --uid 10001 --gid 10001 appuser

# Ensure the application directory is owned by the runtime user
RUN chown -R appuser:appgroup "/usr/src/app"

# Mount the source code at this volume
# Mount instead of copy allows the auto-reload to work
VOLUME "/usr/src/app"

# Run the container as the non-root user
USER appuser
