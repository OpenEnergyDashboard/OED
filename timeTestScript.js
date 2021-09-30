const axios = require('axios').default;

// Set interceptors so that we are able to time requests.

axios.interceptors.request.use(reqConfig => {
	// https://sabljakovich.medium.com/axios-response-time-capture-and-log-8ff54a02275d
	reqConfig.meta = reqConfig.meta || {};

	reqConfig.meta.requestStartedAt = new Date().getTime();

	return reqConfig;
})

axios.interceptors.response.use(resConfig => {
	resConfig.config.meta.elapsedTime = new Date().getTime() - resConfig.config.meta.requestStartedAt;
	// console.log(`### elapsed time (ms): ${resConfig.config.meta.elapsedTime}`);
	return resConfig;
})

// start and end timestamps need time zones
// returns the elapsed time of the request
// TODO: maybe return data to double check number of points?
// Plot data with plotly
async function requestDataFromInterval(startTimeStamp, endTimestamp, meterId) {
	const url = 'http://localhost:3000'
	const endPoint = `api/compressedReadings/line/meters/${meterId}?timeInterval=${startTimeStamp}_${endTimestamp}`
	const res = await axios.get(`${url}/${endPoint}`)
	return res.config.meta.elapsedTime;
}

async function main() {
	// We deliberately wrap requests in a function so that the promises execute one after another.
	// rather than to submit all requests at once which would affect the execution time of each individual request.
	// The alternative would be to submit each request simultaneously via a forEach or Promise.all,
	// but we choose not to for the reason stated previously.

	const meterId = 5; // meter id of minute data in my db

	const arr = ['2020-02-25T20:28:28Z', '2020-03-10T22:31:01Z', '2020-04-10T22:31:01Z', '2020-05-10T22:31:01Z', '2020-06-10T22:31:01Z']
	const timeIntervals = [
		['2020-01-01 00:00:00Z', '2020-04-15 00:00:00'],
		['2020-01-01 00:00:00Z', '2020-02-22 00:00:00'],
		['2020-01-01 00:00:00Z', '2020-02-19 00:00:00'],
		['2020-01-03 08:00:00Z', '2020-02-14 23:00:00'],
		['2020-01-24 16:00:00Z', '2020-02-14 23:00:00'],
		['2020-01-24 16:00:00Z', '2020-02-04 07:00:00'],
		['2020-02-02 12:00:00Z', '2020-02-04 08:59:00'],
		['2020-02-02 12:00:00Z', '2020-02-04 09:39:00'],
		['2020-02-02 12:00:00Z', '2020-02-04 22:49:00']
	];

	// const arr = ['2020-02-25T20:26:28Z']
	for (let i = 0; i < timeIntervals.length; i++) {
		const [startTimeStamp, endTimestamp] = timeIntervals[i];
		let averageElapsedTime = 0;
		const numRequests = 5; // average elapsed time over 5 requests
		for (let j = 0; j < numRequests; j++) {
			await requestDataFromInterval(startTimeStamp, endTimestamp, meterId)
				.then(et => {
					averageElapsedTime += et;
					console.log(`### elapsed time for request #${i, j} in between ${startTimeStamp}, ${endTimestamp}: ${et} ms`)
				})
				.catch(console.log)
		}
		averageElapsedTime = averageElapsedTime / numRequests;
		console.log(`###### AVERAGE elapsed time for request #${i} in between ${startTimeStamp}, ${endTimestamp}: ${averageElapsedTime} ms`)
	}
}

main();