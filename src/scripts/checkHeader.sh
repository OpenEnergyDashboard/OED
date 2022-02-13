#!/bin/bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

# Checks for the existance of the MPL 2.0 header
MPL_REGEX=".*?This\W+Source\W+Code\W+Form\W+is\W+subject\W+to\W+the\W+terms\W+of\W+the\W+Mozilla\W+Public\W+License,\W+v\.\W+2\.0\.\W+If\W+a\W+copy\W+of\W+the\W+MPL\W+was\W+not\W+distributed\W+with\W+this\W+file,\W+You\W+can\W+obtain\W+one\W+at\W+http:\/\/mozilla\.org\/MPL\/2\.0\/\."

# Get a list of files tracked by Git
FILES=$(git ls-files)
# Filter out text files
FILES=$(echo "$FILES" | grep -v ".*\.md")
FILES=$(echo "$FILES" | grep -v "\.editorconfig")
FILES=$(echo "$FILES" | grep -v "\.gitattributes")
FILES=$(echo "$FILES" | grep -v ".vscode")
FILES=$(echo "$FILES" | grep -v "package\.json")
# Filter out generated files
FILES=$(echo "$FILES" | grep -v "package-lock\.json")
# Filter out images
FILES=$(echo "$FILES" | grep -v "src\/client\/public\/.*")
# Filter out test data
FILES=$(echo "$FILES" | grep -v "src\/server\/test\/db\/data\/.*")
# Filter out outside scripts
FILES=$(echo "$FILES" | grep -v "src\/scripts\/oed\.service")
FILES=$(echo "$FILES" | grep -v "src\/scripts\/updateMamacMetersOEDCron\.bash")
FILES=$(echo "$FILES" | grep -v "src\/scripts\/sendLogEmailCron\.bash")
FILES=$(echo "$FILES" | grep -v "src\/scripts\/refreshReadingViewsCron\.bash")
FILES=$(echo "$FILES" | grep -v "src\/scripts\/refreshHourlyReadingViewsCron\.bash")
# Filter out test data for Obvius
FILES=$(echo "$FILES" | grep -v "src\/server\/test\/web\/obvius\/.*")
# Filter out test data for CSV Pipeline
FILES=$(echo "$FILES" | grep -v "src\/server\/test\/web\/csvPipeline\/.*")
# Filter out .github files
FILES=$(echo "$FILES" | grep -v ".github\/**")

# Counts the files listed in FILES
NFILES=$(echo $FILES | wc -w)

if [ "$NFILES" -eq "0" ]; then
   echo "[MPL2] No files to check for header, please check the checkHeader.sh script.";
   exit 1;
fi

echo "[MPL2] Checking $NFILES files for a Mozilla Public License 2.0 header."

# This searches for the above regex.
# P enables Perl and z enables multi-line support
# s turns off warnings, lv lists files that don't match
MISSING_HEADER=$(grep -Pz -slv "$MPL_REGEX" $FILES)
NMISSING=$(echo $MISSING_HEADER | wc -w)

# Check if there's
if [ ! -z "$MISSING_HEADER" ]; then
	echo "[MPL2] The following $NMISSING files are missing headers:"
	echo "$MISSING_HEADER"
	echo ""
	exit 1
else
	echo "[MPL2] Every source file has a Mozilla Public License 2.0 header."
	echo ""
	exit 0
fi
