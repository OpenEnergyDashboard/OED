/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// https://archive-api.open-meteo.com/v1/archive?latitude=52.52&longitude=13.41&start_date=2024-02-25&end_date=2024-03-10&hourly=temperature_2m&temperature_unit=fahrenheit

// Attribution
// <a href="https://open-meteo.com/">Weather data by Open-Meteo.com</a>

// TODO: Fetch data by user gps/ user input
const { fetchWeatherApi } = require('openmeteo');
// const moment = require('moment');
// Updated function to accept startDate and endDate parameters
function fetchWeatherData(latitude, longitude, startDate, endDate) {
    const params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": startDate,
        "end_date": endDate,
        "hourly": "temperature_2m",
        "temperature_unit": "fahrenheit",
        "timezone": "America/Los_Angeles" // TODO: should not be static
    };
    const url = "https://archive-api.open-meteo.com/v1/archive";

    return fetchWeatherApi(url, params).then(responses => {
        const response = responses[0];
        const utcOffsetSeconds = response.utcOffsetSeconds();
        // console.log(utcOffsetSeconds);
        const timezone = response.timezone();
        // console.log(timezone);
        const timezoneAbbreviation = response.timezoneAbbreviation();
        // console.log(timezoneAbbreviation);
        const latitude = response.latitude();
        const longitude = response.longitude();

        const hourly = response.hourly();

        // Helper function to form time ranges
        const range = (start, stop, step) =>
            Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

        const weatherData = {
            hourly: {
                time: range(Number(hourly.time()), Number(hourly.timeEnd()), hourly.interval()).map(
                    (t) => new Date((t + utcOffsetSeconds) * 1000)
                ),
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
            time: time,
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