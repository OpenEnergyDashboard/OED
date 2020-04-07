/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { connect } from 'react-redux';
import { State } from '../types/redux/state';
import { getComparePeriodLabels, getCompareChangeSummary } from '../utils/calculateCompare';
import { CompareEntity } from './MultiCompareChartContainer';
import translate from '../utils/translate';
import {CompressedBarReading} from '../types/compressed-readings';
import PlotlyChart, { IPlotlyChartProps } from 'react-plotlyjs-ts';

interface CompareChartContainerProps {
	entity: CompareEntity;
}

function mapStateToProps(state: State, ownProps: CompareChartContainerProps): IPlotlyChartProps {
	const comparePeriod = state.graph.comparePeriod;
	const datasets: any[] = [];

	const periodLabels = getComparePeriodLabels(comparePeriod);

	const colorize = (changeForColorization: number) => {
		if (changeForColorization < 0) {
			return 'green';
		}
		return 'red';
	};

	// Compose the text to display to the user.
	const entity = ownProps.entity;
	const changeSummary = getCompareChangeSummary(entity.change, entity.name, periodLabels);

	const barColor = 'rgba(218, 165, 32, 1)';

	const previousPeriod = entity.prevUsage;
	const currentPeriod = entity.currUsage;


	datasets.push(
		{
			x: [periodLabels.prev, periodLabels.current],
			y: [previousPeriod, currentPeriod],
			hovertext: [
				`<b>${previousPeriod} KW</b> ${translate('used.this.time')}<br>${periodLabels.prev.toLowerCase()}`,
				`<b>${currentPeriod} KW</b> ${translate('used.so.far')}<br>${periodLabels.current.toLowerCase()}`
			],
			hoverinfo: 'text',
			type: 'bar',
			marker: {color: barColor},
			text: [ `<b>${previousPeriod} kW</b>`, `<b>${currentPeriod} kW</b>`],
			textposition: 'auto',
			textfont: {
				color: 'rgba(0,0,0,1)'
			}
		}
	);

	const layout: any = {
		title: `<b>${changeSummary}</b>`,
		titlefont: {
			size: 10,
			color: colorize(entity.change)
		},
		hovermode: 'closest',
		autosize: true,
		showlegend: false,
		legend: {
		},
		yaxis: {
			title: 'kW',
			showgrid: true,
			gridcolor: '#ddd'
		},
		xaxis: {
			showgrid: false,
			gridcolor: '#ddd'
		},
		margin: {
			t: 20,
			b: 120,
			l: 60,
			r: 20
		}
	};

	// Assign all the paramaters required to create the Plotly object (data, layout, config) to the variable props, returned by mapStateToProps
	// The Plotly toolbar is displayed if displayModeBar is set to true
	const props: IPlotlyChartProps = {
		data: datasets,
		layout,
		config: {
			displayModeBar: false
		}
	};

	return props;
}

const plotlyConstructor: any = PlotlyChart;
export default connect(mapStateToProps)(plotlyConstructor);
