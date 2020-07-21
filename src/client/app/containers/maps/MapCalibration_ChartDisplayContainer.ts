/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {connect} from "react-redux";
import PlotlyChart, {IPlotlyChartProps} from "react-plotlyjs-ts";
import {State} from "../../types/redux/state";
import * as plotly from "plotly.js";
import {CartesianPoint, Dimensions, normalizeImageDimensions} from "../../utils/calibration";
import {updateCurrentCartesian} from "../../actions/map";
import store from "../../index";

function mapStateToProps(state: State) {
	let x: number[] = [];
	let y: number[] = [];
	let texts: string[] = [];

	const mapID = state.maps.calibratingMap;
	const map = state.maps.editedMaps[mapID]
	const points = map.calibrationSet;
	if (points) {
		for (let i = 0; i < points.length; i++) {
			const current = points[i];
			x.push(current.cartesian.x);
			y.push(current.cartesian.y);
			texts.push(`latitude: ${current.gps.latitude}, longitude: ${current.gps.longitude}`);
		}
	}
	let image = new Image();
	image.src = map.mapSource;
	const imageDimensions: Dimensions = normalizeImageDimensions( {
		width: image.width,
		height: image.height,
	});
	let backgroundTrace = createBackgroundTrace(imageDimensions);
	let dataPointTrace = {
		x: x,
		y: y,
		type: 'scatter',
		mode: 'markers',
		marker: {
			color: 'rgb(7,110,180)',
			opacity: 0.5,
			size: 6,
		},
		text: texts,
		opacity: 1,
		showlegend: false
	};
	let data = [backgroundTrace,dataPointTrace];

	const imageSource = map.mapSource;

	// for a detailed description of layout attributes: https://plotly.com/javascript/reference/#layout
	const layout: any = {
		width: 1000,
		height: 1000,
		xaxis: {
			visible: false, // changes all visibility settings including showgrid, zeroline, showticklabels and hiding ticks
			range: [0, 500], // range of displayed graph
		},
		yaxis: {
			visible: false,
			range: [0, 500],
			scaleanchor:'x',
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
			opacity: 1,
		}],
	};

	/***
	 * Usage:
	 *  <PlotlyChart data={toJS(this.model_data)}
	 *               layout={layout}
	 *               onClick={({points, event}) => console.log(points, event)}>
	 */
	const props: IPlotlyChartProps = {
		data: data,
		layout: layout,
		onClick: (event: plotly.PlotMouseEvent) => handlePointClick(event),
	}
	return props;
}

/**
 * use a transparent heatmap to capture which point the user clicked on the map
 * @param imageDimensions {Dimensions} normalized dimensions of the image
 */
function createBackgroundTrace(imageDimensions: Dimensions) {
	// define what the grid of the heatmap look like
	let x = [];
	let y = [];
	// bound the grid to image dimensions to avoid clicking outside of the map
	for (let i = 0; i <= Math.ceil(imageDimensions.width); i = i + 1) {
		x.push(i);
	}
	for (let j = 0; j <= Math.ceil(imageDimensions.height); j = j + 1) {
		y.push(j);
	}
	// define the actual points of the graph, numbers in the array are used to designate different colors;
	let z = [];
	for (let j = 0; j < y.length; j++) {
		let temp = [];
		for (let k = 0; k < x.length; k++) {
			temp.push(0);
		}
		z.push(temp);
	}
	let trace = {
		x: x,
		y: y,
		z: z,
		type: 'heatmap',
		colorscale: [['0.0', 'rgba(6,86,157,0)']], // set colors to be fully transparent
		xgap: 1,
		ygap: 1,
		hoverinfo: 'none',
		opacity: '0',
		showscale: false
	};
	return trace;
}

function handlePointClick(event: plotly.PlotMouseEvent) {
	event.event.preventDefault();
	let currentPoint: CartesianPoint = getClickedCoordinates(event);
	store.dispatch(updateCurrentCartesian(currentPoint));
}

function getClickedCoordinates(event: plotly.PlotMouseEvent) {
	event.event.preventDefault();
	/**
	 *  points on backgroundTrace and dataPointTrace will be captured if they are both close to the click
	 *  for now, all of the points from dataPointTrace are ignored;
 	 */
	let eligiblePoints = [];
	for (let i=0; i < event.points.length; i++) {
		let pointNumber = event.points[i].pointNumber;
		let traceNumber = event.points[i].curveNumber;
		if (traceNumber == 0) {
			eligiblePoints.push(event.points[i]);
		}
	}
	console.log(eligiblePoints);
	const xValue = eligiblePoints[0].x as number;
	const yValue = eligiblePoints[0].y as number;
	const clickedPoint: CartesianPoint = {
		x: Number(xValue.toFixed(6)),
		y: Number(yValue.toFixed(6)),
	};
	return clickedPoint;
}

export default connect(mapStateToProps)(PlotlyChart);
