#!/usr/bin/env bash

# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

# If we're in a container, pass '--host' flag so server remains
# accessible outside the container.
extra_args=
if [ -f /.dockerenv ]; then
	# This is passed to vite, which exposts the port to the
	# host (outside the container)
	extra_args="--host"
fi

# `npm ci` is handled by the 'installOED.sh', which is also ran by `docker-compose`
# Here, we wait until `.package-lock.json` exists, or when `npm ci` has finished.
until [ -f 'node_modules/.package-lock.json' ]; do
	printf '%s\n' "Waiting for node_modules to install"
	sleep 5
done

npm run client:dev -- $extra_args
