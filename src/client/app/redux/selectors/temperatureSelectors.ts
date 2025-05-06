/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 import { createSelector } from '@reduxjs/toolkit';
 import { RootState } from 'store';
 
 /**
  * Selector to get the temperature data from the Redux store.
  * @param state - The Redux state.
  * @returns The temperature data.
  */
 export const selectTemperatureData = (state: RootState) => state.temperature.temperatureData;
 
 /**
  * Selector to get the loading state for temperature data.
  * @param state - The Redux state.
  * @returns Whether the temperature data is being loaded.
  */
 export const selectTemperatureLoading = (state: RootState) => state.temperature.isFetching;
 
 /**
  * Selector to get the error state for temperature data.
  * @param state - The Redux state.
  * @returns The error message, if any.
  */
 export const selectTemperatureError = (state: RootState) => state.temperature.error;
 
 /**
  * Selector to get the selected temperature unit (Celsius or Fahrenheit).
  * @param state - The Redux state.
  * @returns The selected temperature unit.
  */
 export const selectTemperatureUnit = (state: RootState) => state.temperature.unit;
 
 /**
  * Selector to get the formatted temperature data for plotting.
  * This selector processes the raw temperature data into a format suitable for Plotly.
  * @param state - The Redux state.
  * @returns The formatted temperature data.
  */
 export const selectFormattedTemperatureData = createSelector(
   [selectTemperatureData],
   (temperatureData) => {
     if (!temperatureData || !temperatureData.hourly) {
       return null;
     }
 
     // Using optional chaining and nullish coalescing to handle undefined properties
     return {
       time: temperatureData.hourly.time ?? [], // Default to empty array if undefined
       temperature: temperatureData.hourly.temperature ?? [], // Default to empty array if undefined
     };
   }
 );
 
 /**
  * Selector to check if there is enough temperature data to display.
  * @param state - The Redux state.
  * @returns Whether there is enough temperature data.
  */
 export const selectHasEnoughTemperatureData = createSelector(
   [selectTemperatureData],
   (temperatureData) => {
     return (
       (temperatureData?.hourly?.time?.length ?? 0) > 1 &&
       (temperatureData?.hourly?.temperature?.length ?? 0) > 1
     );
   }
 );
 
 /**
  * Selector to get the temperature unit options (Celsius and Fahrenheit).
  * @param state - The Redux state.
  * @returns The temperature unit options.
  */
 export const selectTemperatureUnitOptions = createSelector(
   [selectTemperatureUnit],
   (unit) => {
     return [
       { value: 'Celsius', label: 'Celsius' },
       { value: 'Fahrenheit', label: 'Fahrenheit' },
     ];
   }
 );
 