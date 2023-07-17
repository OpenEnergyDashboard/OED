import * as React from 'react';
import * as moment from 'moment';
import Plot from 'react-plotly.js';
import { State } from '../types/redux/state';
import { useSelector } from 'react-redux';
import { ThreeDReading } from '../types/readings'
import { roundTimeIntervalForFetch } from '../utils/dateRangeCompatability';
import { lineUnitLabel } from '../utils/graphics';
import { AreaUnitType, getAreaUnitConversion } from '../utils/getAreaUnitConversion';

/**
 * Component used to render 3D graphics
 * @returns 3D Plotly 3D Surface Graph
 */
export default function ThreeDComponent() {
	const dataToRender = useSelector((state: State) => {

		// No Meter Selected => undefined => falsy
		if (!state.graph.selectedMeters[0] || state.readings.threeD.isFetching) {
			return null;
		}
		const timeInterval = roundTimeIntervalForFetch(state.graph.timeInterval).toString();
		const unitID = state.graph.selectedUnit;
		const precision = state.graph.threeDAxisPrecision;
		const meterThreeDReadings = state.readings.threeD.byMeterID?.[state.graph.selectedMeters[0]]?.[timeInterval]?.[unitID]?.[precision]?.readings;

		if (!meterThreeDReadings) {
			return null;
		}

		return formatThreeDData(meterThreeDReadings, state);
	});

	return (
		<Plot data={dataToRender} layout={layout} config={config} />
	);
}

/**
 * Formats Readings for plotly 3d surface
 * @param data 3D data to be formatted
 * @param state current application state
 * @returns the a time interval into a dateRange compatible for a date-picker.
 */
function formatThreeDData(data: ThreeDReading, state: State): Array<object> {
	const selectedMeterID = state.graph.selectedMeters[0];

	// The unit label depends on the unit which is in selectUnit state.
	const graphingUnit = state.graph.selectedUnit;
	// The current selected rate
	const currentSelectedRate = state.graph.lineGraphRate;
	let unitLabel = '';
	let needsRateScaling = false;
	if (graphingUnit !== -99) {
		const selectUnitState = state.units.units[state.graph.selectedUnit];
		if (selectUnitState !== undefined) {
			// Determine the y-axis label and if the rate needs to be scaled.
			const returned = lineUnitLabel(selectUnitState, currentSelectedRate, state.graph.areaNormalization, state.graph.selectedAreaUnit);
			unitLabel = returned.unitLabel
			needsRateScaling = returned.needsRateScaling;
			// The rate will be 1 if it is per hour (since state readings are per hour) or no rate scaling so no change.
			const rateScaling = needsRateScaling ? currentSelectedRate.rate : 1;

			const meterArea = state.meters.byMeterID[selectedMeterID].area;
			// We either don't care about area, or we do in which case there needs to be a nonzero area.
			if (!state.graph.areaNormalization || (meterArea > 0 && state.meters.byMeterID[selectedMeterID].areaUnit != AreaUnitType.none)) {
				// Convert the meter area into the proper unit if normalizing by area or use 1 if not so won't change reading values.
				const areaScaling = state.graph.areaNormalization ?
					meterArea * getAreaUnitConversion(state.meters.byMeterID[selectedMeterID].areaUnit, state.graph.selectedAreaUnit) : 1;
				// Divide areaScaling into the rate so have complete scaling factor for readings.
				const scaling = rateScaling / areaScaling;
				data.zData = data.zData.map(day => day.map(reading => reading * scaling));
			}
		}
	}
	layout.scene.zaxis.title = unitLabel;

	return [{
		type: 'surface',
		x: data.xData.map(xData => moment.utc(xData).format()),
		y: data.yData.map(yData => moment.utc(yData).format()),
		z: data.zData,
		hoverinfo: 'text',
		hovertext: data.zData.map((day, i) => day.map((readings, j) => //TODO format hover-text based on locale
			`Date: ${moment.utc(data.yData[i]).format('MMM DD, YYYY')}<br>Time: ${moment.utc(data.xData[j]).format('h:mm A')}<br>${unitLabel}: ${readings}`))
	}]
}

const layout = {
	autosize: true,
	showlegend: true,
	height: 700,
	scene: {
		xaxis: {
			title: 'Hours of Day',
			tickformat: '%I:%M %p'
			// tickformat: '%X' default locale formatting
			// nticks: 4 auto works fine.
		},
		yaxis: {
			title: 'Days of Calendar Year',
			tickformat: '%x' // Locale aware date formatting.
			// nticks: 6
		},
		zaxis: { title: 'Resource Usage' },
		camera: {
			// Somewhat suitable camera eye values for data of zResource[day][hour]
			eye: {
				x: 2, // Adjust x value for zoom
				y: -1.25, // Adjust y value for zoom
				z: 0.1 // Adjust z value for zoom
			}
		}
	}
};
const config = {
	responsive: true
};