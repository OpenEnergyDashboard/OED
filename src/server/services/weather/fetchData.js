/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// https://archive-api.open-meteo.com/v1/archive?latitude=52.52&longitude=13.41&start_date=2024-02-25&end_date=2024-03-10&hourly=temperature_2m&temperature_unit=fahrenheit

// Attribution
// <a href="https://open-meteo.com/">Weather data by Open-Meteo.com</a>

// TODO Fetch data by user gps/ user input
const { fetchWeatherApi } = require('openmeteo');
const moment = require('moment');

// Updated function to accept startDate and endDate parameters
function fetchWeatherData(latitude, longitude, startDate, endDate) {
	const params = {
		"latitude": latitude,
		"longitude": longitude,
		"start_date": startDate,
		"end_date": endDate,
		"hourly": "temperature_2m",
		"temperature_unit": "celsius",
	};
	const url = "https://archive-api.open-meteo.com/v1/archive";

	return fetchWeatherApi(url, params).then(responses => {
		const response = responses[0];
		const utcOffsetSeconds = response.utcOffsetSeconds();

		const hourly = response.hourly();

		// Helper function to form time ranges
		const range = (start, stop, step) =>
			Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

		const weatherData = {
			hourly: {
				// Generates an array of timestamps from API's time range
				time: range(Number(hourly.time()), Number(hourly.timeEnd()), hourly.interval()).map(
					(t) => new Date((t + utcOffsetSeconds) * 1000)
				),
				// Extracts temperature values array
				temperature2m: hourly.variables(0).valuesArray(),
			},
		};

		// for (let i = 0; i < weatherData.hourly.time.length; i++) {
		//     console.log(
		//         weatherData.hourly.time[i].toISOString(),
		//         weatherData.hourly.temperature2m[i]
		//     );
		// }
		// Instead of logging, return the formatted weather data
		return weatherData.hourly.time.map((time, index) => ({
			// TODO Lock to correct timezone.
			time: moment(time),
			temperature: weatherData.hourly.temperature2m[index]
		}));
	}).catch(err => {
		console.error('Error fetching weather data:', err);
	});
}

// Example usage of the function
// const latitude = 36.6537;
// const longitude = 121.799;
// const startDate = '2024-04-20'; // Use an actual date that makes sense for your data
// const endDate = moment().subtract(3, 'days').format('YYYY-MM-DD');
// fetchWeatherData(latitude, longitude, startDate, endDate)
//   .then(data => {
//     console.log('Weather Data:', data);
//   })
//   .catch(error => {
//     console.error('Error fetching weather data:', error);
//   });

// TODO: fetchData.js should fetch both weatherData and weatherLocation information.

// if (require.main === module) {
// 	const args = process.argv.slice(2);

// 	if (args.length < 4) {
// 		console.log('Usage: npm run fetchWeatherData -- <latitude> <longitude> <startDate> <endDate>');
// 		console.log('Example: npm run fetchWeatherData -- 36.6537 121.799 2024-04-20 2024-04-23');
// 		process.exit(1);
// 	}

// 	const [latitude, longitude, startDate, endDate] = args;

// 	fetchWeatherData(
// 		parseFloat(latitude),
// 		parseFloat(longitude),
// 		startDate,
// 		endDate
// 	).then(data => {
// 		console.log('Weather Data Retrieved:');
// 		console.log(JSON.stringify(data, null, 2));
// 	}).catch(error => {
// 		console.error('Error:', error);
// 		process.exit(1);
// 	});
// }

module.exports = { fetchWeatherData };
