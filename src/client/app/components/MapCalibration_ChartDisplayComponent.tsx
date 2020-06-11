import PlotlyChart from 'react-plotlyjs-ts';
import * as plotly from 'plotly.js';
import * as React from 'react';
import {CalibratedPoint, CartesianPoint} from '../utils/calibration';

interface MapCalibrationProps {
	mapImage: HTMLImageElement;
	acceptedPoints: CalibratedPoint[];
	updateGraphCoordinates(currentPoint: CartesianPoint): any;
}

export default class MapCalibration_ChartDisplayComponent extends React.Component<MapCalibrationProps, {}>{
	constructor(props: MapCalibrationProps) {
		super(props);
		this.handlePointClick = this.handlePointClick.bind(this);
		this.getGraphCoordinates = this.getGraphCoordinates.bind(this);
	}

	public render() {
		let x: number[] = [];
		let y: number[] = [];
		let texts: string[] = [];

		const points = this.props.acceptedPoints;
		for (let i = 0; i < points.length; i++) {
			const current = points[i];
			x.push(current.getCartesian().x);
			y.push(current.getCartesian().y);
			texts.push(current.getGPSString());
		}

		let backTrace = this.createBackgroundGrid();
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

		const source = this.props.mapImage.src;

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

		return (
			<PlotlyChart data={data} layout={layout} onClick={this.handlePointClick.bind(this)}/>
		);
	}

	private createBackgroundGrid() {
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

	private handlePointClick(event: plotly.PlotMouseEvent) {
		let currentPoint = this.getGraphCoordinates(event);
		this.props.updateGraphCoordinates(currentPoint);
	}

	private getGraphCoordinates(event: plotly.PlotMouseEvent) {
		// both points will be captured if there is already a data point nearby
		for(let i=0; i < event.points.length; i++) {
			let pn = event.points[i].pointNumber;
			let tn = event.points[i].curveNumber;
			console.log(`trace number: ${tn}`);
		}
		// actual code;
		const xValue = event.points[0].x as number;
		const yValue = event.points[0].y as number;
		const currentPoint: CartesianPoint = {
			x: Number(xValue.toFixed(6)),
			y: Number(yValue.toFixed(6)),
		}
		window.alert(`Please enter GPS coordinates for this point below.`);
		return currentPoint;
	}
}
