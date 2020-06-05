import { connect } from 'react-redux';
import { State } from '../types/redux/state';
import { Dispatch } from '../types/redux/actions';
import { MapModeTypes } from '../types/redux/map';
import PlotlyChart, { IPlotlyChartProps } from 'react-plotlyjs-ts';

function mapStateToProps(state: State) {
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

	let x = [500];
	let y = [500];
	let texts = ['placeHolder'];
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

	const source = state.map.source;
	console.log(`layout source: ${state.map.source}`);
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
	};
	return props;
}

export default connect(mapStateToProps)(PlotlyChart);
