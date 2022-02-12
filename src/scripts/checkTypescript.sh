#!/bin/bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

# The directory to check
CHECK_DIR="./src/client/app"
echo "[TSC] Checking $CHECK_DIR for JavaScript source files."

# Get a list of files in the tree that are JS or JSX files.
FILES=$(find "$CHECK_DIR" \! -name "data.js" -iname "*.js" -o -iname "*.jsx")

# Counts the files listed in FILES
NFILES=$(echo $FILES | wc -w)

# Check if there were any files
if [ ! "$NFILES" -eq "0" ]; then
	echo "[TSC] The following $NFILES JavaScript source files exist in the tree:"
	echo "$FILES"
	echo ""
	exit 1
else 
	echo "[TSC] No file in the tree is a JavaScript source file."
	echo ""
	exit 0
fi
