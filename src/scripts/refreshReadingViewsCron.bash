# This should be copied to /etc/ and the copy renamed so that its function will be clear to admins.
# This should be executed daily after fetching midnight readings, since it aggregates data at day level and above.
# You can set execution time for cron jobs in the /etc/crontab file.

# The absolute path the project root directory (OED)
cd '/example/path/to/project/OED'

# The following line should NOT need to be edited except by devs.
docker-compose run --rm web npm run --silent refreshReadingViews &>> /dev/null &
