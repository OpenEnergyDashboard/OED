# Csv web testing tools

Here are some sample files for testing the csv pipeline route.

For instance:

curl localhost:3000/api/csv -X POST \
	-F 'mode=meter' \
	-F 'csvfile=@src/server/test/web/csvPipeline/sampleMeters.csv'
