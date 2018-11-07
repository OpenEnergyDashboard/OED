/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import * as datalabels from 'chartjs-plugin-datalabels';
import Plot, {PlotParams} from 'react-plotly.js';
import { connect } from 'react-redux';
import { State } from '../types/redux/state';
import { getComparePeriodLabels } from '../utils/calculateCompare';
import { CompareEntity } from './MultiCompareChartContainer';

if (datalabels === null || datalabels === undefined) {
	throw new Error('Datalabels plugin was tree-shaken out.');
}

interface CompareChartContainerProps {
	entity: CompareEntity;
}

function mapStateToProps(state: State, ownProps: CompareChartContainerProps): PlotParams {
	const comparePeriod = state.graph.comparePeriod;
	const periodLabels = getComparePeriodLabels(comparePeriod);
	const soFar: Plotly.Data = {
		x: [periodLabels.prev, periodLabels.current],
		y: [10, 20],
		name: 'soFar',
		type: 'bar'
	};
	const whole: Plotly.Data = {
		x: [periodLabels.prev, periodLabels.current],
		y: [30 - 10, 45 - 20],
		name: 'whole',
		type: 'bar'
	};
	const chartData: Plotly.Data [] = [soFar, whole];
	const chartLayout: Partial<Plotly.Layout> = {
		barmode: 'group',
		title: 'compare'
	};
	const props: PlotParams = {
		data : chartData,
		layout : chartLayout
	};

	return props;
}

// Escape from TypeScript here. TypeScript doesn't like the fact that Bar is non typed.
const plotConstructor: any = Plot;
export default connect(mapStateToProps)(plotConstructor);
