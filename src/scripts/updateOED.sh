#!/bin/bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

echo "Upgrading OED"

# Install NPM dependencies
echo "NPM ci to upgrade the packages..."
npm ci --loglevel=warn --progress=false
echo "NPM install finished."

echo "Attempting to migrate database to latest version..."
npm run migratedb -- highest

echo "Doing docker compose up --no-start --build to capture any changes needed for images/containers without starting..."
docker compose up --no-start --build

echo "Doing webpack:build to update the application..."
npm run webpack:build

echo "OED upgrade completed"
