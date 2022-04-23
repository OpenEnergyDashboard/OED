#!/bin/bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

#Input the pathname for the backup
#ie PATH="/home/eddy/Database_Dumps/<site name>"
PATH="" #INPUT REQUIRED
DATE=`date +%Y-%m-%d"_"%H_%M_%S
FINAL_PATH="${PATH}/dump_${DATE}.sql" 

sudo docker-compose exec database pg_dump -U oed > FINAL_PATH