import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { TemperatureData } from "redux/temperature";
import moment from "moment";

const fetchTemperatureData = async (): Promise<{ data: TemperatureData[] }> => {
  try {
    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear}-01-01T00:00:00Z`; // Start date: January 1st of the current year
    const endDate = moment().toISOString(); // End date: Today's date and time

    // Use Open-Meteo's API to get hourly temperature data for today
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=temperature_2m`
    );
    const result = await response.json();

    if (!result.hourly || !result.hourly.time || !result.hourly.temperature_2m) {
      return { data: [] }; // Return empty data if API response is invalid
    }

    // Process the data: Calculate average temperature per month for the current year
    const temperatureData: TemperatureData[] = [];
    const months = Array(12).fill(0); // To accumulate temperatures for each month
    const monthsCount = Array(12).fill(0); // To count how many data points for each month

    // Process hourly data and accumulate values for each month
    result.hourly.time.forEach((timestamp: string, index: number) => {
      const month = new Date(timestamp).getMonth(); // Extract the month (0-based index)
      months[month] += result.hourly.temperature_2m[index]; // Add the temperature to the corresponding month
      monthsCount[month] += 1; // Increment the count of temperature data points for the month
    });

    // Calculate the average temperature for each month
    for (let i = 0; i < 12; i++) {
      if (monthsCount[i] > 0) {
        temperatureData.push({
          timestamp: `${currentYear}-${String(i + 1).padStart(2, '0')}-01T00:00:00Z`, // Set the first day of the month
          value: months[i] / monthsCount[i], // Average temperature for the month
        });
      }
    }

    return { data: temperatureData };
  } catch (error) {
    console.error("Failed to fetch temperature data:", error);
    return { data: [] };
  }
};

export const temperatureApi = createApi({
  reducerPath: "temperatureApi",
  baseQuery: fetchBaseQuery(),
  endpoints: (builder) => ({
    getTemperatureData: builder.query<TemperatureData[], void>({
      queryFn: async () => {
        const { data } = await fetchTemperatureData();
        return { data };
      },
    }),
  }),
});

export const { useGetTemperatureDataQuery } = temperatureApi;
