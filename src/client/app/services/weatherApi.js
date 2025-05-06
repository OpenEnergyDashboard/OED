// src/services/weatherApi.js
import { fetchWeatherApi } from 'openmeteo';

export const fetchWeatherData = async (latitude, longitude) => {
  const params = {
    latitude,
    longitude,
    hourly: 'temperature_2m',
  };
  const url = 'https://api.open-meteo.com/v1/forecast';
  const responses = await fetchWeatherApi(url, params);

  // Helper function to form time ranges
  const range = (start, stop, step) =>
    Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

  // Process first location
  const response = responses[0];

  // Attributes for timezone and location
  const utcOffsetSeconds = response.utcOffsetSeconds();
  const timezone = response.timezone();
  const timezoneAbbreviation = response.timezoneAbbreviation();
  const latitudeResponse = response.latitude();
  const longitudeResponse = response.longitude();

  const hourly = response.hourly();

  // Weather data structure
  const weatherData = {
    latitude: latitudeResponse,
    longitude: longitudeResponse,
    timezone,
    timezoneAbbreviation,
    hourly: {
      time: range(Number(hourly.time()), Number(hourly.timeEnd()), hourly.interval()).map(
        (t) => new Date((t + utcOffsetSeconds) * 1000)
      ),
      temperature2m: hourly.variables(0).valuesArray(),
    },
  };

  return weatherData;
};