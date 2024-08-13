/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { PlotData, PlotMouseEvent } from 'plotly.js';
import * as React from 'react';
import Plot from 'react-plotly.js';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { selectSelectedLanguage } from '../../redux/slices/appStateSlice';
import { localEditsSlice } from '../../redux/slices/localEditsSlice';
import Locales from '../../types/locales';
import { CalibrationSettings } from '../../types/redux/map';
import { Dimensions, normalizeImageDimensions } from '../../utils/calibration';
import { selectMapById } from '../../redux/api/mapsApi';

/**
 * @returns TODO DO ME
 */
export default function MapCalibrationChartDisplayContainer() {
	const dispatch = useAppDispatch();
	const x: number[] = [];
	const y: number[] = [];
	const texts: string[] = [];
	const currentLanguange = useAppSelector(selectSelectedLanguage);
	const map = useAppSelector(state => selectMapById(state, state.localEdits.calibratingMap));

	const settings = useAppSelector(state => state.localEdits.calibrationSettings);
	const points = map.calibrationSet;
	if (points) {
		for (const point of points) {
			x.push(point.cartesian.x);
			y.push(point.cartesian.y);
			texts.push(`latitude: ${point.gps.latitude}, longitude: ${point.gps.longitude}`);
		}
	}
	const imageDimensions: Dimensions = normalizeImageDimensions({
		width: map.imgWidth,
		height: map.imgHeight
	});
	const backgroundTrace = createBackgroundTrace(imageDimensions, settings);
	const dataPointTrace = {
		x,
		y,
		type: 'scatter',
		mode: 'markers',
		marker: {
			color: 'rgb(7,110,180)',
			opacity: 0.5,
			size: 6
		},
		text: texts,
		opacity: 1,
		showlegend: false
	};
	const data = [backgroundTrace, dataPointTrace];

	const imageSource = map.mapSource;

	// for a detailed description of layout attributes: https://plotly.com/javascript/reference/#layout
	const layout: any = {
		width: 1000,
		height: 1000,
		xaxis: {
			visible: false, // changes all visibility settings including showgrid, zeroline, showticklabels and hiding ticks
			range: [0, 500] // range of displayed graph
		},
		yaxis: {
			visible: false,
			range: [0, 500],
			scaleanchor: 'x'
		},
		images: [{
			layer: 'below',
			source: imageSource,
			xref: 'x',
			yref: 'y',
			x: 0,
			y: 0,
			sizex: 500,
			sizey: 500,
			xanchor: 'left',
			yanchor: 'bottom',
			sizing: 'contain',
			opacity: 1
		}]
	};

	return <Plot
		data={data as PlotData[]}
		layout={layout}
		config={{
			// makes locales available for use
			locales: Locales,
			locale: currentLanguange
		}}
		onClick={(event: PlotMouseEvent) => {
			event.event.preventDefault();
			dispatch(localEditsSlice.actions.updateCurrentCartesian(event));
		}}
	/>;
}

/**
 * use a transparent heatmap to capture which point the user clicked on the map
 * @param imageDimensions Normalized dimensions of the image
 * @param settings Settings for calibration displays
 * @returns point and data
 */
function createBackgroundTrace(imageDimensions: Dimensions, settings: CalibrationSettings) {
	// define the grid of heatmap
	const x: number[] = [];
	const y: number[] = [];
	// bound the grid to image dimensions to avoid clicking outside of the map
	for (let i = 0; i <= Math.ceil(imageDimensions.width); i = i + 1) {
		x.push(i);
	}
	for (let j = 0; j <= Math.ceil(imageDimensions.height); j = j + 1) {
		y.push(j);
	}
	// define the actual points of the graph, numbers in the array are used to designate different colors;
	const z: number[][] = [];
	for (let ind1 = 0; ind1 < y.length; ++ind1) {
		const temp = [];
		for (let ind2 = 0; ind2 < x.length; ++ind2) {
			temp.push(0);
		}
		z.push(temp);
	}
	const trace = {
		x,
		y,
		z,
		type: 'heatmap',
		colorscale: [['0.5', 'rgba(6,86,157,0)']], // set colors to be fully transparent
		xgap: 1,
		ygap: 1,
		hoverinfo: 'x+y',
		opacity: (settings.showGrid) ? '0.5' : '0', // controls whether the grids will be displayed
		showscale: false
	};
	return trace;
}