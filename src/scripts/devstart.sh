#!/bin/sh

# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

extra_args=
if [ -f /.dockerenv ]; then
	# This is passed to vite, which exposts the port to the
	# host (outside the container)
	extra_args="--host"
fi

# This script is mostly for use in containerized environments,
# but there's no reason not to use it in non-container ones.
# It starts the autorebuild in the background and then
# runs the server.
npm run vite:dev -- $extra_args &
npm run start:dev
