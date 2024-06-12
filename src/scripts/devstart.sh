#!/bin/sh

# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

# This script is mostly for use in containerized environments,
# but there's no reason not to use it in non-container ones.
# It starts the autorebuild in the background and then
# runs the server.

# If we're in a Docker environment, and we're using Vite (not Webpack), then
# append host so docker binds the dev server to the host
# TODO: Remove the second predicate when Webpack is removed
extra_args=
if [ -f '/.dockerenv' ] &&
	{ grep '"client:dev"' ./package.json | grep -q 'vite:dev'; }; then
  extra_args='--host'
fi

npm run client:dev $extra_args &
npm run start:dev
