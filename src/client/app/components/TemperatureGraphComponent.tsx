import * as moment from "moment";
import * as React from "react";
import Plot from "react-plotly.js";
import { readingsApi, stableEmptyLineReadings } from "../redux/api/readingsApi";
import { useAppSelector } from "../redux/reduxHooks";
import { selectCompareLineQueryArgs } from "../redux/selectors/chartQuerySelectors";
import { selectLineUnitLabel } from "../redux/selectors/plotlyDataSelectors";
import { selectSelectedLanguage } from "../redux/slices/appStateSlice";
import { selectGraphState, selectShiftAmount } from "../redux/slices/graphSlice";
import { selectThreeDComponentInfo } from "../redux/selectors/threeDSelectors";
import { selectPlotlyMeterData } from "../redux/selectors/lineChartSelectors";
import { MeterOrGroup, ShiftAmount } from "../types/redux/graph";
import { useGetTemperatureDataQuery } from "../redux/api/temperatureApi";
import { selectTemperatureUnit } from "../redux/slices/temperatureSlice";
import translate from "../utils/translate";
import SpinnerComponent from "./SpinnerComponent";
import ThreeDPillComponent from "./ThreeDPillComponent";
import { setHelpLayout } from "./ThreeDComponent";

const TemperatureGraphComponent: React.FC = () => {
  const graphState = useAppSelector(selectGraphState);
  const meterOrGroupID = useAppSelector(selectThreeDComponentInfo).meterOrGroupID;
  const unitLabel = useAppSelector(selectLineUnitLabel);
  const locale = useAppSelector(selectSelectedLanguage);
  const shiftAmount = useAppSelector(selectShiftAmount);
  const { args, shouldSkipQuery, argsDeps } = useAppSelector(selectCompareLineQueryArgs);
  const selectedUnit = useAppSelector(selectTemperatureUnit);

  // Fetch temperature data every hour for the current year (each month)
  const { data: temperatureData, isFetching: isFetchingTemperature } = useGetTemperatureDataQuery();

  // Process temperature data to calculate monthly averages and ensure values are in the correct unit
  const processedTemperatureData = temperatureData?.map((d) => ({
    timestamp: new Date(d.timestamp).toISOString(),
    value: selectedUnit === "Fahrenheit" ? (d.value * 9) / 5 + 32 : d.value,
  })) ?? [];

  // Fetch meter data using `readingsApi.useLineQuery()`
  const { data: meterGraphData, isFetching: isFetchingMeterData } = readingsApi.useLineQuery(args, {
    skip: shouldSkipQuery,
    selectFromResult: ({ data, ...rest }) => ({
      ...rest,
      data: selectPlotlyMeterData(data ?? stableEmptyLineReadings, {
        ...argsDeps,
        compatibleEntities: [meterOrGroupID!],
      }),
    }),
  });

  // Helper function to clean and flatten data
  const cleanArray = (arr: any): number[] => {
    if (arr instanceof Float32Array || arr instanceof Int8Array) {
      return Array.from(arr);
    }
    if (Array.isArray(arr)) {
      return arr.flat().filter((v) => typeof v === "number");
    }
    return [];
  };

  // Ensure meter data x-values are properly formatted
  const meterX: (string | number | Date)[] =
    meterGraphData
      ?.flatMap((d) => {
        if (Array.isArray(d.x)) return d.x.flat().map(String);
        if (d.x instanceof Float32Array || d.x instanceof Int8Array) return Array.from(d.x).map(String);
        return d.x ? [String(d.x)] : [];
      }) ?? [];

  const meterY: number[] = meterGraphData?.flatMap((d) => cleanArray(d.y)) ?? [];

  // Ensure temperature data x and y values are properly formatted
  const tempX: (string | number | Date)[] = processedTemperatureData.map((d) => d.timestamp);
  const tempY: number[] = processedTemperatureData.map((d) => d.value);

  const enoughData = meterX.length > 1 && tempX.length > 1;

  let layout = {};

  if (!meterOrGroupID) {
    layout = setHelpLayout(translate("select.meter.group"));
  } else if (!graphState.queryTimeInterval.getIsBounded()) {
    layout = setHelpLayout(translate("please.set.the.date.range"));
  } else if (!enoughData) {
    layout = setHelpLayout(translate("no.data.in.range"));
  } else {
    layout = {
      autosize: true,
      showlegend: true,
      legend: { x: 0, y: 1.1, orientation: "h" },
      yaxis: {
        title: "Meter Readings",
        gridcolor: "#ddd",
        fixedrange: true,
      },
      yaxis2: {
        title: `Temperature (${selectedUnit})`, // Dynamically display temperature units (°C or °F)
        overlaying: "y",
        side: "right",
        showgrid: false,
      },
      xaxis: {
        title: "Time",
        type: "category", // Treat X-axis as categorical for months
        tickmode: "array",
        tickvals: tempX, // Use the generated month timestamps
        ticktext: tempX.map((date) => moment(date).format("MMM YYYY")), // Format months as "Jan 2025", "Feb 2025"
      },
    };
  }

  return (
    <div>
      <ThreeDPillComponent />
      {isFetchingMeterData || isFetchingTemperature ? (
        <SpinnerComponent loading height={50} width={50} />
      ) : (
        <Plot
          key={JSON.stringify(args)} // Force re-render if args change
          data={[
            // Meter Data Line (Left Y-Axis)
            {
              x: meterX, // Correct Type: (string | number | Date)[]
              y: meterY, // Correct Type: number[]
              type: "scatter",
              mode: "lines",
              marker: { color: "red" },
              name: "Meter Data",
              yaxis: "y1",
            },
            // Temperature Data Line (Right Y-Axis)
            {
              x: tempX, // Correct Type: (string | number | Date)[]
              y: tempY, // Correct Type: number[]
              type: "scatter",
              mode: "lines",
              marker: { color: "#0bb8ff" },
              name: "Temperature",
              yaxis: "y2",
            },
          ]}
          layout={layout}
          config={{
            responsive: true,
            displayModeBar: false,
            locale,
          }}
        />
      )}
    </div>
  );
};

export default TemperatureGraphComponent;
