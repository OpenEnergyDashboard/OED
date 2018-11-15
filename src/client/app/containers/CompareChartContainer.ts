/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import * as datalabels from 'chartjs-plugin-datalabels';
import { connect } from 'react-redux';
import { State } from '../types/redux/state';
import { getComparePeriodLabels, getCompareChangeSummary } from '../utils/calculateCompare';
import { CompareEntity } from './MultiCompareChartContainer';
import * as Plotly from 'plotly.js';
import { PlotParams } from 'react-plotly.js';
const createPlotlyComponent = require( 'react-plotly.js/factory');
const Plot = createPlotlyComponent(Plotly);

if (datalabels === null || datalabels === undefined) {
	throw new Error('Datalabels plugin was tree-shaken out.');
}

interface CompareChartContainerProps {
	entity: CompareEntity;
}

function mapStateToProps(state: State, ownProps: CompareChartContainerProps): PlotParams {
	const comparePeriod = state.graph.comparePeriod;
	const periodLabels = getComparePeriodLabels(comparePeriod);
	const entity = ownProps.entity;

	const readingsBeforeCurrentTime: Plotly.Data = {
		x: [periodLabels.prev, periodLabels.current],
		y: [entity.usedToThisPointLastTimePeriod, entity.currentPeriodUsage],
		name: 'Before current time',
		type: 'bar'
	};
	const readingsAfterCurrentTime: Plotly.Data = {
		x: [periodLabels.prev, periodLabels.current],
		y: [entity.lastPeriodTotalUsage, Math.round((entity.currentPeriodUsage / entity.usedToThisPointLastTimePeriod) * entity.lastPeriodTotalUsage)],
		name: 'After current time',
		type: 'bar'
	};
	const chartData: Plotly.Data [] = [readingsBeforeCurrentTime, readingsAfterCurrentTime];
	const chartLayout: Partial<Plotly.Layout> = {
		barmode: 'group',
		title: getCompareChangeSummary(entity.change, entity.name, periodLabels)
	};
	const props: PlotParams = {
		data: chartData,
		layout: chartLayout
	};

	return props;
}

function colorlizeCompareGraphTitle(changeForColorization: number): string {
	if (changeForColorization < 0) {
		return 'green';
	}
	return 'red';
}

export default connect(mapStateToProps)(Plot);
