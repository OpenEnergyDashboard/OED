import * as React from 'react';
import Plot from 'react-plotly.js';
import { State } from '../types/redux/state';
import { useSelector } from 'react-redux';
// import * as moment from 'moment';
// import { useState } from 'react';

/**
 * Component used to render 3D graphics
 * @returns 3D Plotly 3D Surface Graph
 */
export default function ThreeDComponent() {

	const layout = {
		autosize: true,
		showlegend: true,
		height: 700,
		scene: {
			xaxis: {
				title: 'Hours of Day',
				nticks: 4
			},
			yaxis: {
				title: 'Days of Calendar Year',
				nticks: 6
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

	const selectedMeterData = useSelector((state: State) => {
		if (state.graph.selectedMeters[0] === undefined)
			return [undefined];
		const selectedMeter = state.graph.selectedMeters[0];
		const selectedTimeInterval = state.graph.threeDTimeInterval.toString();
		const selectedUnit = state.graph.selectedUnit;
		const selected3DPrecision = state.graph.threeDAxisPrecision;
		const meter3DReadings = state.readings.threeD.byMeterID[selectedMeter][selectedTimeInterval][selectedUnit][selected3DPrecision].readings;
		if (meter3DReadings)
			return [{
				type: 'surface',
				x: meter3DReadings.xData,
				y: meter3DReadings.yData,
				z: meter3DReadings.zData,
				hoverinfo: 'text',
				hovertext: meter3DReadings.zData.map(
					(day, i) => day.map(
						(readings, j) => `Date: ${meter3DReadings.yData[i]}<br>Time: ${meter3DReadings.xData[j]}<br>Usage: ${readings}`))
			}]
		else
			return [undefined];

	});
	return (
		<div>
			<Plot data={selectedMeterData} layout={layout} config={config} />
		</div>
	);
}