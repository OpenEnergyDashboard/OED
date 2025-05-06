import React from "react";
import { useAppSelector, useAppDispatch } from "../redux/reduxHooks";
import { selectTemperatureUnit, updateTemperatureUnit, } from "../redux/slices/temperatureSlice";
import translate from "../utils/translate";
import { TemperatureUnit } from "redux/temperature";

const TemperatureUnitDropdown: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedUnit = useAppSelector(selectTemperatureUnit);

  const handleUnitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(updateTemperatureUnit(event.target.value as TemperatureUnit)); // Type assertion to fix error
  };

  return (
    <div>
      <label htmlFor="temp-unit-select">{translate("temperature.unit")}:</label>
      <select id="temp-unit-select" value={selectedUnit} onChange={handleUnitChange}>
        <option value="Celsius">{translate("temperature.celsius")}</option>
        <option value="Fahrenheit">{translate("temperature.fahrenheit")}</option>
      </select>
    </div>
  );
};

export default TemperatureUnitDropdown;
