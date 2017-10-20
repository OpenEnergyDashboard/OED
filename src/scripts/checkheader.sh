#!/bin/bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

echo "[MPL] Checking source files for MPL headers..."

# Checks for the existance of the MPL header
MPL_REGEX=".*?This\W+Source\W+Code\W+Form\W+is\W+subject\W+to\W+the\W+terms\W+of\W+the\W+Mozilla\W+Public\W+License,\W+v\.\W+2\.0\.\W+If\W+a\W+copy\W+of\W+the\W+MPL\W+was\W+not\W+distributed\W+with\W+this\W+file,\W+You\W+can\W+obtain\W+one\W+at\W+http:\/\/mozilla\.org\/MPL\/2\.0\/\."

# This find commands lists all our source code files, excluding bad directories
# It prunes gitignore and gitattributes, and everything in the public dir, .git, node_modules, and postgres-data
FILES=$(find . -type f \( -iname '*.jsx' -o -iname '*.js' -o -iname '*.sh' -o -iname '*.sql' -o -iname "*.y*ml" \
	-o -iname "Dockerfile" -o -iname "*.html" -o -iname "*.css" \) -print \
	\( -iname "*.gitignore" -o -iname "*.gitattributes" \) -prune \
	-o \( -path '*node_modules*' -o -path '*postgres-data*' -o -path '*.git*' -o -path "*client/public*" \) -prune);

# This searches for the above regex. 
# P enables Perl and z enables multi-line support
# s turns off warnings, lv lists files that don't match
MISSING_HEADER=$(grep -Pz -slv "$MPL_REGEX" $FILES)

# Check if there's 
if [ ! -z "$MISSING_HEADER" ]; then
	echo "[MPL] The following files are missing headers:"
	echo "$MISSING_HEADER"
	echo ""
	exit 1
else 
	echo "[MPL] Every source file has an MPL header."
	exit 0
fi
