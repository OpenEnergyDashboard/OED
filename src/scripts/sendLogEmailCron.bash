# This should be copied to /etc/cron.daily/ and the copy renamed so that its function will be clear to admins.
# The absolute path the project root directory (OED)
cd '/example/path/to/project/OED'

# The following line should NOT need to be edited except by devs or if you have an old system with only docker-compose.
docker compose run --rm web npm run --silent sendLogEmail &>> /dev/null &
