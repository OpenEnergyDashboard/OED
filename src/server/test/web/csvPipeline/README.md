# Csv web testing tools

Here are some sample files for testing the csv pipeline route.

For instance:

```bash
curl localhost:3000/api/csv/meters -X POST \
	-F 'csvfile=@src/server/test/web/csvPipeline/sampleMeters.csv'
```

```bash
curl localhost:3000/api/csv/readings -X POST \
	-F 'csvfile=@src/server/test/web/csvPipeline/sampleReadings.csv' \
	-F 'meterName=solar' \
	-F 'gzip=true' \
	-F 'createMeter=true' \
	-F 'cumulative=false' \
	-F 'cumulativeReset=false' \
	-F 'duplications=1' \
	-F 'headerRow=false' \
	-F 'timeSort=increasing'
```