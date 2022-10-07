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

# Though generally not needed, it is possible that you need to refresh the reading views after a migration.
# This is definitely needed for the migration to 1.0.0 because it deletes the old views and creates new ones.
# It is quite possible this could be commented out in the future but it probably does not do any harm except
# taking a little time.
echo "Doing docker compose run web npm run refreshAllReadingViews to refresh the reading views for doing graphics..."
docker compose run web npm run refreshAllReadingViews

echo "OED upgrade completed"
