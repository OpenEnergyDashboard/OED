# This aggregates the readings data at day level and above.
# This should be copied to /etc/ or /etc/cron.daily/ and the copy renamed so that its function will be clear to admins.
# This should be executed daily after fetching midnight readings, such as 12:30 am.

# The absolute path the project root directory (OED)
cd '/example/path/to/project/OED'

# The following line should NOT need to be edited except by devs or if you have an old system with only docker-compose.
docker compose run --rm web npm run --silent refreshReadingViews &>> /dev/null &
