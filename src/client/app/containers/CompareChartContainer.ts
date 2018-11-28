/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import * as datalabels from 'chartjs-plugin-datalabels';
import { connect } from 'react-redux';
import { State } from '../types/redux/state';
import { getCompareChangeSummary, getCompareBarTitles, getComparePeriodLabelsForXAxis } from '../utils/calculateCompare';
import { CompareEntity } from './MultiCompareChartContainer';
import PlotlyChart, { IPlotlyChartProps } from 'react-plotlyjs-ts';

if (datalabels === null || datalabels === undefined) {
	throw new Error('Datalabels plugin was tree-shaken out.');
}

interface CompareChartContainerProps {
	entity: CompareEntity;
}

function mapStateToProps(state: State, ownProps: CompareChartContainerProps) {
	const comparePeriod = state.graph.comparePeriod;
	const periodLabels = getComparePeriodLabelsForXAxis(comparePeriod);
	const barTitles = getCompareBarTitles(comparePeriod);
	const entity = ownProps.entity;
	const currentUsageColor = 'rgba(218, 165, 32, 1)';
	const totalUsageColor = 'rgba(173, 216, 230, 1)';

	const readingsForCurrentUsage: any = {
		x: [periodLabels.prev, periodLabels.current],
		y: [entity.usedToThisPointLastTimePeriod, entity.currentPeriodUsage],
		text: 'kW',
		name: barTitles.barForCurrentUsage,
		type: 'bar',
		marker: {
			color: currentUsageColor
		}
	};
	const readingsForTotalUsage: any = {
		x: [periodLabels.prev, periodLabels.current],
		y: [entity.lastPeriodTotalUsage, Math.round((entity.currentPeriodUsage / entity.usedToThisPointLastTimePeriod) * entity.lastPeriodTotalUsage)],
		text: 'kW',
		name: barTitles.barForTotalUsage,
		type: 'bar',
		marker: {
			color: totalUsageColor
		}
	};
	const data: any[] = [readingsForCurrentUsage, readingsForTotalUsage];
	const layout: any = {
		title: getCompareChangeSummary(entity.change, entity.name, periodLabels),
		titlefont: {
			color: colorlizeCompareGraphTitle(entity.change)
		},
		barmode: 'stack'
	};
	const props: IPlotlyChartProps = {
		data,
		layout
	};

	return props;
}

function colorlizeCompareGraphTitle(changeForColorization: number): string {
	if (changeForColorization < 0) {
		return 'green';
	}
	return 'red';
}

const plotly: any = PlotlyChart;
export default connect(mapStateToProps)(plotly);
