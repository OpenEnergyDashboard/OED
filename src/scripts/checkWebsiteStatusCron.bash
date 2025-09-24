#!/bin/bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

# This check the website status at hour level.
# This should be copied to /etc/ or /etc/cron.hourly/ or /etc/cron.daily and the copy renamed so that its function will be clear to admins.

# Check if a URL is provided as an argument
if [ -z "$1" ]; then
    echo "Error: No URL provided. Usage: $0 URL-to-check"
    exit 1
fi

URL=$1

# The absolute path the project root directory (OED)
cd '/example/path/to/project/OED'

# The following line should NOT need to be edited except by devs or if you have an old system with only docker-compose.
docker compose run --rm web npm run --silent checkWebsiteStatus -- $URL &>> /dev/null &
