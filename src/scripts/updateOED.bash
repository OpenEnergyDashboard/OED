#!/usr/bin/env bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *
# This should be copied to /etc/cron.hourly/ and the copy renamed so that its function will be clear to admins.
# The absolute path the project root directory (OED)
cd '/example/path/to/project/OED'

# The following line should NOT need to be edited except by devs.
docker-compose run --rm web npm run --silent updateMamacMeters &>> /dev/null &
