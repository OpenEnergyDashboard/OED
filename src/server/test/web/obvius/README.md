# Obvius web testing tools

Here are some sample files for testing Obvius routes.

For instance to upload the config file (with meter info):
```bash
curl localhost:3000/api/obvius -X POST \
	-F 'username=test' \
	-F 'password=password' \
	-F 'mode=CONFIGFILEUPLOAD' \
	-F 'serialnumber=mb-001' \
	-F 'modbusdevice=1234' \
	-F 'logfile=@src/server/test/web/obvius/mb-001.ini.gz'
```

and to do the log file (with readings):
```bash
curl localhost:3000/api/obvius -X POST \
	-F 'username=test' \
	-F 'password=password' \
	-F 'mode=LOGFILEUPLOAD' \
	-F 'serialnumber=mb-001' \
	-F 'logfile=@src/server/test/web/obvius/mb-001.log.gz'
```
