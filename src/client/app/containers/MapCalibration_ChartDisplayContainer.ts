/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {connect} from "react-redux";
import PlotlyChart, {IPlotlyChartProps} from "react-plotlyjs-ts";
import {State} from "../types/redux/state";
import * as plotly from "plotly.js";
import {CartesianPoint} from "../utils/calibration";
import {Dispatch} from "../types/redux/actions";
import {updateCurrentCartesian} from "../actions/map";
import store from "../index";

function mapStateToProps(state: State) {
	let x: number[] = [];
	let y: number[] = [];
	let texts: string[] = [];

	const points = state.map.calibration.calibrationSet;
	for (let i = 0; i < points.length; i++) {
		const current = points[i];
		x.push(current.getCartesian().x);
		y.push(current.getCartesian().y);
		texts.push(current.getGPSString());
	}

	let backTrace = createBackgroundGrid();
	let trace1 = {
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
	let data = [backTrace,trace1];

	const imageSource = state.map.calibration.image.src;

	const layout: any = {
		width: 1000,
		height: 1000,
		xaxis: {
			range: [0, 500], //range of displayed graph
			showgrid: true, // hide grid lines in graph
			zeroline: true,
			showticklabels: false // hide numbers on zeroline
		},
		yaxis: {
			range: [0, 500],
			showgrid: true,
			zeroline: true,
			showticklabels: false,
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
		onClick: ({points, event}) => handlePointClick(points, event)
	}
	return props;
}

function createBackgroundGrid() {
	let x = [];
	let y = [];
	for (let i = 0; i < 500; i = i + 0.1) {
		x.push(i);
	}
	for (let j = 0; j < 500; j = j + 0.1) {
		y.push(j);
	}
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
		colorscale: [['0.0', 'rgba(0,0,0,0.97)'], ['1.0', 'rgb(255, 255, 255, 0.5)']],
		xgap: 1,
		ygap: 1,
		hoverinfo: 'x',
		showscale: false
	};
	return trace;
}

function handlePointClick(points: plotly.PlotDatum[], event: MouseEvent) {
	event.preventDefault();
	let currentPoint: CartesianPoint = getClickedCoordinates(points, event);
	store.dispatch(updateCurrentCartesian(currentPoint));
}

function getClickedCoordinates(points: plotly.PlotDatum[], event: MouseEvent) {
	event.preventDefault();
	// both points will be captured if there is already a data point nearby
	for(let i=0; i < points.length; i++) {
		let pn = points[i].pointNumber;
		let tn = points[i].curveNumber;
		console.log(`trace number: ${tn}`);
	}
	// actual code;
	const xValue = points[0].x as number;
	const yValue = points[0].y as number;
	const clickedPoint: CartesianPoint = {
		x: Number(xValue.toFixed(6)),
		y: Number(yValue.toFixed(6)),
	};
	return clickedPoint;
}

export default connect(mapStateToProps)(PlotlyChart);
