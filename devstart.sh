#!/bin/sh
# This script is mostly for use in containerized environments,
# but there's no reason not ot use it in non-container ones.
# It starts the autorebuild in the background and then 
# runs the server.
npm run dev &
npm start
