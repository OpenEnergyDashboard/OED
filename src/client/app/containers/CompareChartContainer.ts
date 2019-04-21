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

	const readingsAfterCurrentTimeColor = 'rgba(173, 216, 230, 1)';
	const readingsBeforeCurrentTimeColor = 'rgba(218, 165, 32, 1)';
	const projectedDataColor = 'rgba(173, 216, 230, 0.45)';

	const previousPeriodTotal = Math.round(entity.lastPeriodTotalUsage);
	const currentPeriodProjectedTotal = Math.round((entity.currentPeriodUsage / entity.usedToThisPointLastTimePeriod) * entity.lastPeriodTotalUsage);
	const previousPeriodToThisPoint = Math.round(entity.usedToThisPointLastTimePeriod);
	const currentPeriodToThisPoint = Math.round(entity.currentPeriodUsage);

	datasets.push(
		{
			x: [periodLabels.prev, periodLabels.current],
			y: [previousPeriodTotal, currentPeriodProjectedTotal],
			hovertext: [
				`<b>${previousPeriodTotal} KW</b> ${translate('total')}<br>${periodLabels.prev.toLowerCase()}`,
				`<b>${currentPeriodProjectedTotal} KW</b> ${translate('projected.to.be.used')}<br>${periodLabels.current.toLowerCase()}`
			],
			hoverinfo: 'text',
			type: 'bar',
			marker: {color: readingsAfterCurrentTimeColor},
			text: [ `<b>${previousPeriodTotal} kW</b>`, `<b>${currentPeriodProjectedTotal} kW</b>`],
			textposition: 'auto',
			textfont: {
			  color: 'rgba(0,0,0,1)'
			}
		},
		{
			x: [periodLabels.prev, periodLabels.current],
			y: [previousPeriodToThisPoint, currentPeriodToThisPoint],
			hovertext: [
				`<b>${previousPeriodToThisPoint} kW</b> ${translate('used.this.time')}<br>${periodLabels.prev.toLowerCase()}`,
				`<b>${currentPeriodToThisPoint} KW</b> ${translate('used.so.far')}<br>${periodLabels.current.toLowerCase()}`
			],
			hoverinfo: 'text',
			type: 'bar',
			marker: {color: readingsBeforeCurrentTimeColor},
			text: [ `<b>${previousPeriodToThisPoint} kW</b>`, `<b>${currentPeriodToThisPoint} kW</b>`],
			textposition: 'auto',
			textfont: {
			  color: 'rgba(0,0,0,1)'
			}
		},
	)

	// // sorts the data so that one doesn't cover up the other
	// datasets.sort((a, b) => {
	// 	if (a.data !== undefined && b.data !== undefined) {
	// 		return +(a.data[0]) - +(b.data[0]);
	// 	} else {
	// 		return 0;
	// 	}
	// });


	// // apply info to datasets after sort
	// datasets[0].backgroundColor = [readingsBeforeCurrentTimeColor, readingsBeforeCurrentTimeColor];
	// datasets[0].hoverBackgroundColor = [readingsBeforeCurrentTimeColor, readingsBeforeCurrentTimeColor];
	// datasets[1].backgroundColor = [readingsAfterCurrentTimeColor, projectedDataColor];
	// datasets[1].hoverBackgroundColor = [readingsAfterCurrentTimeColor, projectedDataColor];

	const layout: any = {
		title: `<b>${changeSummary}</b>`,
		titlefont: {
			size: 10,
			color: colorize(entity.change)
		},
		hovermode:'closest',
		barmode: 'overlay',
		autozise: true,
		showlegend: false,
		legend: {
		},
		yaxis: {
			title: 'kW',
			showgrid: true,
			gridcolor: '#ddd',
		},
		xaxis: {
			showgrid: false,
			gridcolor: '#ddd'
		},
		margin: {
			t: 20,
			b: 120,
			l: 60,
			r: 20,
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

export default connect(mapStateToProps)(PlotlyChart);
