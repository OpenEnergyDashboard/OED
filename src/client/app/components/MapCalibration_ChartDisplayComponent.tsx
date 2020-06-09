import PlotlyChart from 'react-plotlyjs-ts';
import * as plotly from 'plotly.js';
import * as React from 'react';

interface MapCalibrationProps {
	mapImage: HTMLImageElement;
	graphCoordinates: number[][];
	gpsCoordinates: number[][];
	updateGraphCoordinate(currentPoint: object): any;
}

export default class MapCalibration_ChartDisplayComponent extends React.Component<MapCalibrationProps, any>{
	constructor(props: MapCalibrationProps) {
		super(props);
		this.handlePointClick = this.handlePointClick.bind(this);
	}

	public render() {
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

		let x: number[] = [];
		let y: number[] = [];
		let texts: string[] = [];

		let graph = this.props.graphCoordinates;
		let gps = this.props.gpsCoordinates;
		for (let i = 0; i < graph.length; i++) {
			x.push(graph[i][0]);
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
			<PlotlyChart data={data} layout={layout} onClick={() => this.handlePointClick.bind(this)}/>
		);
	}

	private handlePointClick(event: plotly.PlotMouseEvent) {
		let currentPoint = this.getGraphCoordinates(event);
		this.props.updateGraphCoordinate(currentPoint);
	}

	private getGraphCoordinates(event: plotly.PlotMouseEvent) {
		// both points will be captured if there is already a datapoint nearby
		for(let i=0; i < event.points.length; i++) {
			let pn = event.points[i].pointNumber;
			let tn = event.points[i].curveNumber;
			console.log(`trace number: ${tn}`);
		}
		// actual code;
		const xValue = event.points[0].x as number;
		const yValue = event.points[0].y as number;
		const currentPoint = {
			x: xValue.toFixed(6),
			y: yValue.toFixed(6),
		}
		window.alert(`Current point: ${currentPoint}, \nPlease enter GPS coordinates for this point below.`);
		return currentPoint;
	}

}
