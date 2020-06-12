/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import MapCalibration_ChartDisplayComponent from "../components/MapCalibration_ChartDisplayComponent";
import {connect} from "react-redux";
import PlotlyChart, {IPlotlyChartProps} from "react-plotlyjs-ts";
import {State} from "../types/redux/state";
import * as plotly from "plotly.js";
import {CartesianPoint} from "../utils/calibration";
import {Dispatch} from "../types/redux/actions";
import {updateCurrentCartesian} from "../actions/map";

function mapStateToProps(state: State) {
	let x: number[] = [];
	let y: number[] = [];
	let texts: string[] = [];

	const points = state.map.calibrationSet;
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

	const source = state.map.image.src;

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
			source: source,
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

	const props: IPlotlyChartProps = {
		data: data,
		layout: layout,
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
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		updateGraphCoordinates: (currentCartesian: CartesianPoint) => dispatch(updateCurrentCartesian(currentCartesian))
	}
}
export default connect(mapStateToProps, mapDispatchToProps)(MapCalibration_ChartDisplayComponent);
