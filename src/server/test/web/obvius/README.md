# Obvius web testing tools

Here are some sample files for testing Obvius routes.

For instance:

```bash
curl localhost:3000/api/obvius -X POST \
	-F 'password=password' \
	-F 'mode=LOGFILEUPLOAD' \
	-F 'serialnumber=mb-001' \
	-F 'logfile=@src/server/test/db/web/obvius/mb-001.log.gz'
```

