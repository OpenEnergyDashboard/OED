import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TemperatureUnit } from "redux/temperature";
import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "store";

// Define the structure of our Redux state for temperature
interface TemperatureState {
  unit: TemperatureUnit;
  temperatureData: {
    hourly: {
      time: string[]; // Array of timestamps
      temperature: number[]; // Array of temperature values
    };
  } | null; // Set as null initially if no data is present
  isFetching: boolean;
  error: string | null;
}

// Example mock data for temperature
const mockTemperatureData = {
  hourly: {
    time: [
      "2025-01-01T00:00:00Z",
      "2025-01-01T01:00:00Z",
      "2025-01-01T02:00:00Z",
      "2025-01-01T03:00:00Z",
      "2025-01-01T04:00:00Z",
      "2025-01-01T05:00:00Z",
      "2025-01-01T06:00:00Z",
      "2025-01-01T07:00:00Z",
      "2025-01-01T08:00:00Z",
      "2025-01-01T09:00:00Z",
      "2025-01-01T10:00:00Z",
      "2025-01-01T11:00:00Z",
    ],
    temperature: [5.0, 6.2, 7.0, 6.5, 5.8, 4.5, 3.2, 2.1, 2.5, 3.1, 4.0, 5.1], // Example Celsius temperature values
  },
};

// Initial state with hourly structure and mock data
const initialState: TemperatureState = {
  unit: "Celsius", // Default temperature unit
  temperatureData: mockTemperatureData, // Set mock data as the initial state
  isFetching: false,
  error: null,
};

// Create the Redux slice
export const temperatureSlice = createSlice({
  name: "temperature",
  initialState,
  reducers: {
    updateTemperatureUnit: (state, action: PayloadAction<TemperatureUnit>) => {
      state.unit = action.payload;
    },
    setTemperatureData: (
      state,
      action: PayloadAction<{ time: string[]; temperature: number[] }>
    ) => {
      state.temperatureData = { hourly: action.payload };
      state.isFetching = false;
      state.error = null; // Clear error when data is successfully set
    },
    setFetchingTemperature: (state, action: PayloadAction<boolean>) => {
      state.isFetching = action.payload;
    },
    setTemperatureError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isFetching = false; // Stop fetching when there's an error
    },
  },
});

// Export actions for use in components
export const {
  updateTemperatureUnit,
  setTemperatureData,
  setFetchingTemperature,
  setTemperatureError,
} = temperatureSlice.actions;

// Selectors
export const selectTemperatureUnit = (state: RootState) => state.temperature.unit;
export const selectTemperatureData = (state: RootState) => state.temperature.temperatureData;
export const selectIsFetchingTemperature = (state: RootState) => state.temperature.isFetching;
export const selectTemperatureError = (state: RootState) => state.temperature.error;

// New selector to handle formatted temperature data for plotting
export const selectFormattedTemperatureData = createSelector(
  [selectTemperatureData],
  (temperatureData) => {
    if (!temperatureData || !temperatureData.hourly) {
      return null;
    }

    return {
      time: temperatureData.hourly.time,
      temperature: temperatureData.hourly.temperature,
    };
  }
);

// Selector to check if there is enough temperature data to display
export const selectHasEnoughTemperatureData = createSelector(
  [selectTemperatureData],
  (temperatureData) => {
    // Ensure temperatureData is not null and that hourly exists
    return (
      (temperatureData?.hourly?.time?.length ?? 0) > 1 &&
      (temperatureData?.hourly?.temperature?.length ?? 0) > 1
    );
  }
);

// Export reducer to add to store
export default temperatureSlice.reducer;
